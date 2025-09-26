import { router, useForm } from '@inertiajs/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export type BulkCouponDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  promotionId: string;
};

export default function BulkCouponDialog({ open, onOpenChange, promotionId }: BulkCouponDialogProps) {
  const { data, setData, processing, clearErrors } = useForm({
    count: '50',
    prefix: '',
    length: '10',
    is_active: true,
    max_redemptions: '',
    expires_at: '',
  });

  const close = React.useCallback(() => {
    onOpenChange(false);
    clearErrors();
  }, [onOpenChange, clearErrors]);

  const submit = React.useCallback(() => {
    clearErrors();
    const payload: any = {
      count: Number(data.count) || 0,
      prefix: data.prefix || '',
      length: Number(data.length) || 10,
      is_active: Boolean(data.is_active),
      max_redemptions: data.max_redemptions || null,
      expires_at: data.expires_at || null,
    };
    router.post(route('management.promotions.coupons.bulk', promotionId), payload, {
      preserveScroll: true,
      onSuccess: () => {
        // reload untuk refresh tabel
        router.reload({ preserveUrl: true });
        close();
      },
    });
  }, [data, promotionId, close, clearErrors]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Generate Coupons</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Count</Label>
            <Input inputMode="numeric" value={data.count} onChange={(e) => setData('count', e.target.value)} />
            <InputError name="count" />
          </div>
          <div className="grid gap-2">
            <Label>Prefix (optional)</Label>
            <Input value={data.prefix} onChange={(e) => setData('prefix', e.target.value)} />
            <InputError name="prefix" />
          </div>
          <div className="grid gap-2">
            <Label>Length</Label>
            <Input inputMode="numeric" value={data.length} onChange={(e) => setData('length', e.target.value)} />
            <InputError name="length" />
          </div>
          <div className="grid gap-2">
            <Label>Max Redemptions (optional)</Label>
            <Input inputMode="numeric" value={data.max_redemptions} onChange={(e) => setData('max_redemptions', e.target.value)} />
            <InputError name="max_redemptions" />
          </div>
          <div className="grid gap-2">
            <Label>Expires At (optional)</Label>
            <Input type="date" value={data.expires_at} onChange={(e) => setData('expires_at', e.target.value)} />
            <InputError name="expires_at" />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={Boolean(data.is_active)} onCheckedChange={(v) => setData('is_active', v)} />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>Cancel</Button>
          <Button type="button" disabled={processing} onClick={submit}>Generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

