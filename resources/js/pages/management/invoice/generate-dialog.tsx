import { router } from '@inertiajs/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import SearchSelect, { type SearchOption } from '@/components/ui/search-select';

import type { ContractOption } from './types';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contracts: ContractOption[];
};

export default function GenerateInvoiceDialog({ open, onOpenChange, contracts }: Props) {
  const [selectedContract, setSelectedContract] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<'per_month' | 'full'>('per_month');
  const [target, setTarget] = React.useState<'current' | 'next'>('next');
  const [reason, setReason] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const selected = React.useMemo(() => contracts.find((c) => c.id === (selectedContract ?? '')) ?? null, [contracts, selectedContract]);
  const isMonthly = selected?.period === 'Monthly';

  const contractOptions: SearchOption[] = React.useMemo(() => contracts.map((c) => ({ value: c.id, label: c.name, description: c.period ?? undefined, payload: c })), [contracts]);

  React.useEffect(() => {
    if (selected && !isMonthly) {
      setMode('full');
      setTarget('next');
    }
  }, [selected?.id, isMonthly]);

  const onSubmit = React.useCallback(() => {
    if (!selectedContract || !reason.trim()) return;
    setSaving(true);
    router.post(
      route('management.invoices.generate'),
      { contract_id: selectedContract, mode, reason, target },
      {
        preserveScroll: true,
        onFinish: () => {
          setSaving(false);
          onOpenChange(false);
          // reset local state
          setSelectedContract(null);
          setMode('per_month');
          setTarget('next');
          setReason('');
        },
      },
    );
  }, [selectedContract, mode, reason, target]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Buat tagihan cepat untuk kontrak terpilih. Pilih mode & periode (jika bulanan), lalu beri catatan singkat.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Kontrak</Label>
            <div className="mt-1">
              <SearchSelect
                value={selectedContract ?? undefined}
                onChange={(val) => setSelectedContract(val || null)}
                options={contractOptions}
                placeholder="Cari atau pilih kontrak…"
              />
            </div>
          </div>
          {selected ? (
            <div>
              <Label>Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as 'per_month' | 'full')}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_month" disabled={!isMonthly}>Bulanan (1 bulan)</SelectItem>
                  <SelectItem value="full">Lunas (sisa kontrak)</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {isMonthly ? 'Bulanan dapat dipilih 1 bulan atau lunas.' : 'Harian/mingguan harus lunas.'}
              </div>
            </div>
          ) : null}
          {selected && isMonthly ? (
            <div>
              <Label>Periode Tagihan</Label>
              <Select value={target} onValueChange={(v) => setTarget(v as 'current' | 'next')}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next">Bulan berikutnya</SelectItem>
                  <SelectItem value="current">Bulan ini (generate ulang)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div>
            <Label>Catatan</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: penagihan periode berikutnya, penyesuaian pembayaran, dll."
              rows={3}
              required
              maxLength={200}
              autoFocus
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{reason.length}/200</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={onSubmit} disabled={saving || !selectedContract || !reason.trim()}>
            {saving ? 'Memproses…' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
