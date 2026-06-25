'use client'

import { useState, useTransition, type FormEvent } from 'react';
import { addRecipe, assignEatOutToDay, assignRecipeToDay, deleteRecipe } from '../actions/meal-planner';
import styles from './MealPlanner.module.css';

type GroceryItem = {
  id: string;
  name: string;
  lastStocked: Date;
  estimatedDays: number;
  needsRestock: boolean;
};

type Recipe = {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string;
};

type MealPlan = {
  dateKey: string;
  recipeId: string | null;
  eatOutDescription: string | null;
};

type DayPlan = {
  selection: string;
  eatOutDescription: string;
};

const EAT_OUT_VALUE = '__eat_out__';

type Day = {
  id: string;
  name: string;
  date: number;
  isToday: boolean;
};

const getUpcomingWeek = (): Day[] => {
  const generatedDays: Day[] = [];
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

  return generatedDays;
};

export default function MealPlanner({ items, recipes, mealPlans }: { items: GroceryItem[]; recipes: Recipe[]; mealPlans: MealPlan[] }) {
  const [isPending, startTransition] = useTransition();
  const [isCreateRecipeOpen, setIsCreateRecipeOpen] = useState(false);
  const days = getUpcomingWeek();

  const calculateDaysAgo = (date: Date) => {
    const diffTime = Math.abs(new Date().getTime() - new Date(date).getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const inStockNames = items
    .filter((item) => {
      const daysAgo = calculateDaysAgo(item.lastStocked);
      return !item.needsRestock && daysAgo < item.estimatedDays;
    })
    .map((item) => item.name.toLowerCase());

  const isIngredientInStock = (ingredient: string) => {
    const loweredIngredient = ingredient.toLowerCase();
    return inStockNames.some(
      (stockItem) =>
        stockItem.includes(loweredIngredient) || loweredIngredient.includes(stockItem)
    );
  };

  const getMissingIngredients = (recipe: Recipe) =>
    recipe.ingredients.filter((ingredient) => !isIngredientInStock(ingredient));

  const mealPlanMap = mealPlans.reduce<Record<string, DayPlan>>((acc, plan) => {
    acc[plan.dateKey] = {
      selection: plan.recipeId ? plan.recipeId : (plan.eatOutDescription ? EAT_OUT_VALUE : ''),
      eatOutDescription: plan.eatOutDescription ?? '',
    };
    return acc;
  }, {});

  const [assignments, setAssignments] = useState<Record<string, DayPlan>>(mealPlanMap);

  const getDayPlan = (dateKey: string): DayPlan => (
    assignments[dateKey] ?? { selection: '', eatOutDescription: '' }
  );

  const getRecipeNameById = (recipeId: string) =>
    recipes.find((recipe) => recipe.id === recipeId)?.name ?? 'Recipe';

  const handleCreateRecipe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      await addRecipe(formData);
      form.reset();
      setIsCreateRecipeOpen(false);
    });
  };

  const handleAssignRecipe = (dateKey: string, selection: string) => {
    const existingDescription = getDayPlan(dateKey).eatOutDescription;

    setAssignments((currentState) => ({
      ...currentState,
      [dateKey]: {
        selection,
        eatOutDescription: currentState[dateKey]?.eatOutDescription ?? '',
      },
    }));

    startTransition(async () => {
      if (selection === EAT_OUT_VALUE) {
        await assignEatOutToDay(dateKey, existingDescription);
        return;
      }

      await assignRecipeToDay(dateKey, selection || null);
    });
  };

  const handleEatOutDescriptionChange = (dateKey: string, eatOutDescription: string) => {
    setAssignments((currentState) => ({
      ...currentState,
      [dateKey]: {
        selection: currentState[dateKey]?.selection ?? EAT_OUT_VALUE,
        eatOutDescription,
      },
    }));
  };

  const saveEatOutDescription = (dateKey: string) => {
    const eatOutDescription = getDayPlan(dateKey).eatOutDescription;

    startTransition(async () => {
      await assignEatOutToDay(dateKey, eatOutDescription);
    });
  };

  const handleDeleteRecipe = (recipeId: string) => {
    if (!confirm('Delete this recipe?')) {
      return;
    }

    startTransition(async () => {
      await deleteRecipe(recipeId);
    });
  };

  return (
    <div className={styles.container}>

      <section className={`glass-panel ${styles.createRecipeSection}`}>
        <div className={styles.createRecipeHeader}>
          <h2>Create Recipe</h2>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreateRecipeOpen(true)}
            disabled={isPending}
          >
            New Recipe
          </button>
        </div>
        <p className={styles.createRecipeHint}>Open the recipe form in a pop-out and save when ready.</p>
      </section>

      {isCreateRecipeOpen && (
        <div className={styles.createRecipeOverlay} onClick={() => setIsCreateRecipeOpen(false)}>
          <div className={`glass-panel ${styles.createRecipeModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Create Recipe</h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setIsCreateRecipeOpen(false)}
                disabled={isPending}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleCreateRecipe} className={styles.recipeForm}>
              <input
                type="text"
                name="name"
                placeholder="Recipe name"
                required
                disabled={isPending}
              />
              <textarea
                name="ingredients"
                placeholder="Ingredients (comma-separated or one per line)"
                className={styles.ingredientsInput}
                rows={3}
                disabled={isPending}
              />
              <textarea
                name="instructions"
                placeholder="Instructions"
                className={styles.instructionsInput}
                rows={8}
                required
                disabled={isPending}
              />
              <button type="submit" className="btn btn-primary" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Recipe'}
              </button>
            </form>
          </div>
        </div>
      )}

      <section>
        <h2>This Week&apos;s Meals</h2>
        <div className={styles.weeklyGrid}>
          {days.map(day => {
            const dayPlan = getDayPlan(day.id);
            const isEatOut = dayPlan.selection === EAT_OUT_VALUE;
            const hasRecipe = Boolean(dayPlan.selection) && !isEatOut;
            const statusLabel = hasRecipe
              ? `Recipe: ${getRecipeNameById(dayPlan.selection)}`
              : isEatOut
                ? 'Eat Out'
                : 'No selection';

            return (
            <div
              key={day.id}
              className={`${styles.dayColumn} ${hasRecipe ? styles.dayColumnSelected : ''} ${isEatOut ? styles.dayColumnEatOut : ''} ${!hasRecipe && !isEatOut ? styles.dayColumnEmpty : ''}`}
            >
              <div className={styles.dayTitle}>
                <span style={{ fontWeight: day.isToday ? 'bold' : 'normal', color: day.isToday ? 'var(--primary-color)' : 'inherit' }}>
                  {day.name} {day.date}
                </span>
              </div>
              <div className={`${styles.dayStatus} ${hasRecipe ? styles.dayStatusSelected : ''} ${isEatOut ? styles.dayStatusEatOut : ''} ${!hasRecipe && !isEatOut ? styles.dayStatusEmpty : ''}`}>
                {statusLabel}
              </div>
              <select
                className={styles.daySelect}
                value={dayPlan.selection}
                onChange={(e) => handleAssignRecipe(day.id, e.target.value)}
                disabled={isPending}
              >
                <option value="">No recipe selected</option>
                <option value={EAT_OUT_VALUE}>Eat Out</option>
                {recipes.map((recipe) => {
                  const missingIngredients = getMissingIngredients(recipe);
                  const isReady = missingIngredients.length === 0;

                  return (
                    <option key={recipe.id} value={recipe.id}>
                      {isReady
                        ? `${recipe.name} (ready)`
                        : `${recipe.name} (missing ${missingIngredients.length})`}
                    </option>
                  );
                })}
              </select>
              {isEatOut && (
                <div className={styles.eatOutWrap}>
                  <textarea
                    className={styles.eatOutDescription}
                    placeholder="Where or what are you eating out?"
                    value={dayPlan.eatOutDescription}
                    onChange={(e) => handleEatOutDescriptionChange(day.id, e.target.value)}
                    disabled={isPending}
                    rows={3}
                  />
                  <button
                    type="button"
                    className={`${styles.btnSecondary} ${styles.eatOutSaveBtn}`}
                    onClick={() => saveEatOutDescription(day.id)}
                    disabled={isPending}
                  >
                    Save Note
                  </button>
                </div>
              )}
            </div>
          )})}
        </div>
      </section>

      <section>
        <h2>Recipes</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Create recipes and assign them to any day.</p>

        <div className={styles.recipeGrid}>
          {recipes.map(recipe => {
            const missingIngredients = getMissingIngredients(recipe);

            return (
              <div key={recipe.id} className={`glass-panel ${styles.recipeCard}`}>
                <div>
                  <h3 className={styles.recipeTitle}>{recipe.name}</h3>
                  <div className={styles.ingredientSummary}>
                    {recipe.ingredients.length === 0
                      ? 'No ingredients listed'
                      : `${recipe.ingredients.length - missingIngredients.length}/${recipe.ingredients.length} in stock`}
                  </div>
                  {recipe.ingredients.length > 0 && (
                    <ul className={styles.ingredientList}>
                      {recipe.ingredients.map((ingredient) => {
                        const inStock = isIngredientInStock(ingredient);
                        return (
                          <li key={`${recipe.id}-${ingredient}`} className={inStock ? styles.ingredientInStock : styles.ingredientMissing}>
                            {ingredient} {inStock ? 'in stock' : 'missing'}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className={styles.recipeMethod}>{recipe.instructions}</div>
                </div>
                <button
                  className={`${styles.deleteRecipeBtn} ${styles.btnSecondary}`}
                  onClick={() => handleDeleteRecipe(recipe.id)}
                  disabled={isPending}
                >
                  Delete Recipe
                </button>
              </div>
            );
          })}

          {recipes.length === 0 && (
            <div className="glass-panel">
              <p>No recipes yet. Add your first recipe above.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
