'use client'

import { useState, useTransition } from 'react';
import { addGroceryItem, restockGroceryItem, toggleNeedsRestock, deleteGroceryItem } from '../actions/grocery';
import styles from './GroceryList.module.css';

type GroceryItem = {
  id: string;
  name: string;
  lastStocked: Date;
  estimatedDays: number;
  needsRestock: boolean;
};

export default function GroceryList({ items }: { items: GroceryItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [restockDates, setRestockDates] = useState<Record<string, string>>({});
  const today = new Date().toISOString().split('T')[0];

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    if (!name.trim()) return;

    startTransition(async () => {
      await addGroceryItem(formData);
    });
    e.currentTarget.reset();
  };

  const calculateDaysAgo = (date: Date) => {
    const diffTime = Math.abs(new Date().getTime() - new Date(date).getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const getRestockDate = (itemId: string) => restockDates[itemId] ?? today;

  return (
    <div>
      <form onSubmit={handleAdd} className={styles.formContainer}>
        <input 
          type="text" 
          name="name" 
          placeholder="e.g. Oat Milk" 
          className={styles.formInput} 
          required 
          disabled={isPending}
        />
        <input 
          type="number" 
          name="estimatedDays" 
          placeholder="Lasts roughly (days) e.g. 7" 
          className={styles.formInput}
          defaultValue={7}
          required
          disabled={isPending}
        />
        <input
          type="date"
          name="restockedAt"
          className={`${styles.formInput} ${styles.dateInput}`}
          defaultValue={today}
          required
          disabled={isPending}
        />
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Adding...' : 'Add Item'}
        </button>
      </form>

      <div className={styles.grid}>
        {items.map(item => {
          const daysAgo = calculateDaysAgo(item.lastStocked);
          const needsRestock = item.needsRestock || (daysAgo >= item.estimatedDays);

          return (
            <div key={item.id} className={`glass-panel ${styles.card}`} style={{ borderColor: needsRestock ? 'rgba(239, 68, 68, 0.3)' : '' }}>
              <div>
                <div className={styles.cardHeader}>
                  <h3 className={styles.title}>{item.name}</h3>
                  <span className={`${styles.status} ${needsRestock ? styles.statusNeed : styles.statusOk}`}>
                    {needsRestock ? 'Needs Restock' : 'Stocked'}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <p>Restocked: {daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}</p>
                  <p>Usually lasts: {item.estimatedDays} days</p>
                </div>
              </div>

              <div className={styles.actions}>
                <input
                  type="date"
                  className={styles.actionDateInput}
                  value={getRestockDate(item.id)}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    setRestockDates(prev => ({ ...prev, [item.id]: selectedDate }));
                  }}
                  disabled={isPending}
                />
                <button 
                  onClick={() => startTransition(() => { restockGroceryItem(item.id, getRestockDate(item.id)) })}
                  className={`${styles.btnSmall} ${styles.btnRestock}`}
                  disabled={isPending}
                >
                  Restock Now
                </button>
                <button 
                  onClick={() => startTransition(() => { toggleNeedsRestock(item.id, !item.needsRestock) })}
                  className={`${styles.btnSmall} ${styles.btnToggle}`}
                  disabled={isPending}
                >
                  {item.needsRestock ? 'Mark OK' : 'Mark Low'}
                </button>
                <button 
                  onClick={() => {
                    if(confirm('Delete item?')) startTransition(() => { deleteGroceryItem(item.id) })
                  }}
                  className={`${styles.btnSmall} ${styles.btnDelete}`}
                  disabled={isPending}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {items.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '48px', color: 'var(--text-muted)' }}>
          <p>No groceries added yet. Let&apos;s start tracking!</p>
        </div>
      )}
    </div>
  );
}
