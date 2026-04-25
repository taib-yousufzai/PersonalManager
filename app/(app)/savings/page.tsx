import { verifySession } from '@/lib/firebase/admin'
import { getSavingsBalance, getAllSavingsTransactions } from '@/lib/db/savings'
import { getUSDtoINRRate } from '@/lib/currency'
import { redirect } from 'next/navigation'
import MetricCard from '@/components/ui/MetricCard'
import { SavingsTransactionForm } from '@/components/forms/SavingsTransactionForm'
import { formatINR } from '@/lib/currency'

export default async function SavingsPage() {
  let uid: string
  try {
    uid = await verifySession()
  } catch {
    redirect('/sign-in')
  }

  const [balance, transactions, usdToINR] = await Promise.all([
    getSavingsBalance(uid),
    getAllSavingsTransactions(uid),
    getUSDtoINRRate(),
  ])

  return (
    <div className="px-4 py-6 md:px-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--ivory)' }}>
          Savings Bucket
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-light)' }}>
          Manage your long-term savings and track contributions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <MetricCard 
            label="Total Balance" 
            value={balance} 
            rate={usdToINR} 
            variant="gold" 
          />
          
          <div className="rounded-xl p-6 bg-[var(--obsidian-3)] border border-[var(--border-light)] shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-[var(--muted-light)]">
              Quick Transaction
            </h2>
            <SavingsTransactionForm />
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="rounded-xl bg-[var(--obsidian-2)] border border-[var(--border-light)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-light)] bg-[var(--obsidian-3)]/50">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--muted-light)]">
                Transaction History
              </h2>
            </div>
            
            <div className="divide-y divide-[var(--border-light)]">
              {transactions.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-[var(--muted)]">No transactions yet.</p>
                </div>
              ) : (
                transactions.map((t) => (
                  <div key={t.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-[var(--ivory)]">
                        {t.note || (t.amount > 0 ? 'Savings Deposit' : 'Savings Withdrawal')}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <p className={`text-sm font-bold ${t.amount > 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                      {t.amount > 0 ? '+' : ''}{formatINR(t.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
