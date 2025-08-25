<?php

namespace App\Http\Controllers\Security;

use App\Http\Controllers\Controller;
use App\Http\Requests\Security\UpdatePasswordRequest;
use App\Models\Session;
use App\Traits\LogActivity;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Jenssegers\Agent\Agent;

class SecurityController extends Controller
{
    use LogActivity;

    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();
        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\Session> $rawSessions */
        $rawSessions = $user->sessions()
            ->orderByDesc('last_activity')
            ->get();

        $sessions = $rawSessions->map(function (\App\Models\Session $session) use ($request) {
            $agent = new Agent();
            $agent->setUserAgent((string) $session->user_agent);

            $platform = $agent->platform();
            $browser  = $agent->browser();
            $device   = $agent->device();

            $agentLabel = trim(($browser ?: 'Unknown Browser') . ' on ' . ($platform ?: ($device ?: 'Unknown Device')));

            return [
                'id'          => $session->id,
                'ip_address'  => $session->ip_address,
                'user_agent'  => $session->user_agent,
                'agent_label' => $agentLabel,
                'last_active' => Carbon::createFromTimestamp((int) $session->last_activity)->diffForHumans(),
                'current'     => $session->id === $request->session()->getId(),
            ];
        });

        return Inertia::render('security/index', [
            'status'  => session('status'),
            'summary' => [
                'email_verified'           => !is_null($user->email_verified_at),
                'two_factor_enabled'       => !empty($user->two_factor_secret) && !empty($user->two_factor_confirmed_at),
                'last_password_changed_at' => $user->password_changed_at ?? null,
            ],
            'sessions' => $sessions,
        ]);
    }

    public function updatePassword(UpdatePasswordRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = $request->user();
        $user->forceFill([
            'password'            => Hash::make($validated['password']),
            'password_changed_at' => now(),
        ])->save();

        $this->logEvent(
            event: 'security.password_updated',
            subject: $user,
            logName: 'security',
        );

        return back()->with('status', 'password-updated');
    }

    public function revokeOthers(Request $request)
    {
        $currentId = $request->session()->getId();
        $userId    = $request->user()->id;

        Session::query()
            ->where('user_id', $userId)
            ->where('id', '!=', $currentId)
            ->delete();

        activity('session')
            ->causedBy($request->user())
            ->withProperties(['action' => 'revoke_others'])
            ->log('User revoked all other sessions');

        return back()->with('status', 'Other sessions have been logged out.');
    }

    public function destroySession(Request $request, string $id)
    {
        $userId    = $request->user()->id;
        $currentId = $request->session()->getId();

        $target = Session::query()
            ->where('user_id', $userId)
            ->where('id', $id)
            ->first();

        if (!$target) {
            return back()->withErrors(['sessions' => 'Session not found or not owned by you.']);
        }

        if ($id === $currentId) {
            return back()->withErrors(['sessions' => 'You cannot log out the current session from here.']);
        }

        $target->delete();

        activity('session')
            ->causedBy($request->user())
            ->withProperties(['action' => 'logout_remote', 'session_id' => $id])
            ->log('User logged out a remote session');

        return back()->with('status', 'Selected session has been logged out.');
    }
}
