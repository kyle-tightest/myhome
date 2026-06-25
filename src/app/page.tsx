import { getGroceryItems } from './actions/grocery';
import { getMealPlansForNextWeek, getRecipes } from './actions/meal-planner';
import GroceryList from './components/GroceryList';
import MealPlanner from './components/MealPlanner';
import Link from 'next/link';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const [items, recipes, mealPlans] = await Promise.all([
    getGroceryItems(),
    getRecipes(),
    getMealPlansForNextWeek(),
  ]);
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab || 'groceries';

  const activeStyle = { background: 'rgba(255,255,255,0.1)', color: 'white' };
  const inactiveStyle = { background: 'transparent', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)' };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>MyHome Dashboard</h1>
        <div className={styles.tabNav}>
          <Link href="/?tab=groceries" className={`btn ${styles.tabButton}`} style={currentTab === 'groceries' ? activeStyle : inactiveStyle}>Groceries</Link>
          <Link href="/?tab=meals" className={`btn ${styles.tabButton}`} style={currentTab === 'meals' ? activeStyle : inactiveStyle}>Meals</Link>
        </div>
      </header>
      
      <main>
        {currentTab === 'groceries' ? (
          <section className={styles.section}>
            <h2>Grocery Tracker</h2>
            <p className={styles.sectionIntro}>Keep track of what you need and when to restock.</p>
            <GroceryList items={items} />
          </section>
        ) : (
          <section className={styles.section}>
            <MealPlanner items={items} recipes={recipes} mealPlans={mealPlans} />
          </section>
        )}
      </main>
    </div>
  );
}
