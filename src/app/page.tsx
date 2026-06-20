import { getGroceryItems } from './actions/grocery';
import GroceryList from './components/GroceryList';
import MealPlanner from './components/MealPlanner';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const items = await getGroceryItems();
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab || 'groceries';

  const activeStyle = { background: 'rgba(255,255,255,0.1)', color: 'white' };
  const inactiveStyle = { background: 'transparent', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)' };

  return (
    <div style={{ padding: 'max(5vh, 40px) max(5vw, 40px)', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1>MyHome Dashboard</h1>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/?tab=groceries" className="btn" style={currentTab === 'groceries' ? activeStyle : inactiveStyle}>Groceries</Link>
          <Link href="/?tab=meals" className="btn" style={currentTab === 'meals' ? activeStyle : inactiveStyle}>Meals</Link>
        </div>
      </header>
      
      <main>
        {currentTab === 'groceries' ? (
          <section style={{ marginBottom: '48px' }}>
            <h2>Grocery Tracker</h2>
            <p style={{ marginBottom: '24px' }}>Keep track of what you need and when to restock.</p>
            <GroceryList items={items} />
          </section>
        ) : (
          <section style={{ marginBottom: '48px' }}>
            <MealPlanner items={items} />
          </section>
        )}
      </main>
    </div>
  );
}
