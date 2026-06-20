'use client'

import { useState, useEffect } from 'react';
import styles from './MealPlanner.module.css';

type GroceryItem = {
  id: string;
  name: string;
  lastStocked: Date;
  estimatedDays: number;
  needsRestock: boolean;
};

const mockRecipes = [
  {
    id: 'r1',
    name: 'Avocado Toast & Eggs',
    ingredients: ['Bread', 'Avocado', 'Eggs'],
    method: 'Toast the bread. Mash avocado on top. Fry or poach eggs and place on avocado. Season with salt and pepper.'
  },
  {
    id: 'r2',
    name: 'Creamy Tomato Pasta',
    ingredients: ['Pasta', 'Tomato', 'Cream', 'Garlic'],
    method: 'Boil pasta. Sauté garlic, add chopped tomatoes and cream. Simmer until thick, then mix in pasta.'
  },
  {
    id: 'r3',
    name: 'Chicken Rice Bowl',
    ingredients: ['Chicken', 'Rice', 'Broccoli', 'Soy Sauce'],
    method: 'Cook rice. Pan-fry chicken chunks. Steam broccoli. Serve in a bowl and drizzle with soy sauce.'
  },
  {
    id: 'r4',
    name: 'Oatmeal & Berries',
    ingredients: ['Oats', 'Milk', 'Berries', 'Honey'],
    method: 'Cook oats with milk. Top with fresh berries and a drizzle of honey.'
  }
];

export default function MealPlanner({ items }: { items: GroceryItem[] }) {
  const [weeklyMeals, setWeeklyMeals] = useState<Record<string, string>>({});
  const [days, setDays] = useState<{id: string, name: string, date: number, isToday: boolean}[]>([]);

  useEffect(() => {
    const generatedDays = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      generatedDays.push({
        id: nextDate.toISOString().split('T')[0],
        name: nextDate.toLocaleDateString('en-US', { weekday: 'short' }),
        date: nextDate.getDate(),
        isToday: i === 0,
      });
    }
    setDays(generatedDays);
  }, []);

  const calculateDaysAgo = (date: Date) => {
    const diffTime = Math.abs(new Date().getTime() - new Date(date).getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const inStockNames = items.filter(item => {
    const daysAgo = calculateDaysAgo(item.lastStocked);
    return !item.needsRestock && daysAgo < item.estimatedDays;
  }).map(item => item.name.toLowerCase());

  const checkAvailability = (ingredient: string) => {
    // Basic substring check against stock
    return inStockNames.some(stockItem => stockItem.includes(ingredient.toLowerCase()) || ingredient.toLowerCase().includes(stockItem));
  };

  const assignMeal = (day: string) => {
    const recipeId = prompt("Enter the name of the recipe you'd like to assign here (or cancel to clear):");
    if (recipeId === null) return;
    
    // Simple mock assignment by finding matching name
    if (recipeId.trim() === '') {
      const newMeals = {...weeklyMeals};
      delete newMeals[day];
      setWeeklyMeals(newMeals);
    } else {
      const recipe = mockRecipes.find(r => r.name.toLowerCase().includes(recipeId.toLowerCase()));
      if (recipe) {
        setWeeklyMeals({...weeklyMeals, [day]: recipe.name});
      } else {
        alert("Recipe not found in options.");
      }
    }
  };

  return (
    <div className={styles.container}>
      
      <section>
        <h2>This Week's Meals</h2>
        <div className={styles.weeklyGrid}>
          {days.map(day => (
            <div key={day.id} className={styles.dayColumn}>
              <div className={styles.dayTitle}>
                <span style={{ fontWeight: day.isToday ? 'bold' : 'normal', color: day.isToday ? 'var(--primary-color)' : 'inherit' }}>
                  {day.name} {day.date}
                </span>
              </div>
              {weeklyMeals[day.id] ? (
                <div 
                  className={`${styles.mealSlot} ${styles.mealSlotAssigned}`}
                  onClick={() => assignMeal(day.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') assignMeal(day.id); }}
                  tabIndex={0}
                  role="button"
                >
                  {weeklyMeals[day.id]}
                </div>
              ) : (
                <div 
                  className={styles.mealSlot}
                  onClick={() => assignMeal(day.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') assignMeal(day.id); }}
                  tabIndex={0}
                  role="button"
                >
                  + Assign Meal
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Available Meal Options</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Recipes based on your current grocery stock.</p>
        
        <div className={styles.recipeGrid}>
          {mockRecipes.map(recipe => {
            const hasAllIngredients = recipe.ingredients.every(checkAvailability);
            
            return (
              <div key={recipe.id} className={`glass-panel ${styles.recipeCard}`}>
                <div>
                  <div className={styles.availabilityBadge + ' ' + (hasAllIngredients ? styles.badgeReady : styles.badgeMissing)}>
                    {hasAllIngredients ? 'Ready to cook' : 'Missing ingredients'}
                  </div>
                  <h3 className={styles.recipeTitle}>{recipe.name}</h3>
                  
                  <ul className={styles.ingredientList}>
                    {recipe.ingredients.map((ing, idx) => {
                      const avail = checkAvailability(ing);
                      return (
                        <li key={idx} className={`${styles.ingredientItem} ${avail ? styles.ingredientAvailable : styles.ingredientMissing}`}>
                          {ing} {avail ? '✓' : '✗'}
                        </li>
                      );
                    })}
                  </ul>
                  
                  <div className={styles.recipeMethod}>
                    {recipe.method}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
