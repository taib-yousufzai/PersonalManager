import React from 'react';
import { formatINR, formatUSD, convertINRtoUSD } from '@/lib/currency';

interface CurrencyDisplayProps {
  amount: number;
  rate?: number;
  className?: string;
  usdClassName?: string;
  inline?: boolean;
}

export default function CurrencyDisplay({
  amount,
  rate,
  className = '',
  usdClassName = 'text-xs opacity-70 mt-0.5',
  inline = false,
}: CurrencyDisplayProps) {
  const inr = formatINR(amount);
  const usd = formatUSD(convertINRtoUSD(amount, rate));

  if (inline) {
    return (
      <span className={className}>
        {inr} <span className={usdClassName}>({usd})</span>
      </span>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <span>{inr}</span>
      <span className={usdClassName}>{usd}</span>
    </div>
  );
}
