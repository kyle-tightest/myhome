'use server'

import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { revalidatePath } from 'next/cache'

const connectionString = process.env.DATABASE_URL || ''
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const toDateKey = (date: Date) => date.toISOString().split('T')[0]

const toPlanDate = (dateKey: string) => {
  if (!dateKey) {
    throw new Error('Date is required')
  }

  return new Date(`${dateKey}T00:00:00.000Z`)
}

export async function getRecipes() {
  return await prisma.recipe.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function getMealPlansForNextWeek() {
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 6)

  const mealPlans = await prisma.mealPlan.findMany({
    where: {
      planDate: {
        gte: start,
        lte: end,
      },
    },
    select: {
      planDate: true,
      recipeId: true,
      eatOutDescription: true,
    },
  })

  return mealPlans.map((mealPlan) => ({
    dateKey: toDateKey(mealPlan.planDate),
    recipeId: mealPlan.recipeId,
    eatOutDescription: mealPlan.eatOutDescription,
  }))
}

export async function addRecipe(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const ingredientsRaw = (formData.get('ingredients') as string)?.trim()
  const instructions = (formData.get('instructions') as string)?.trim()

  if (!name) {
    return { error: 'Recipe name is required' }
  }

  if (!instructions) {
    return { error: 'Instructions are required' }
  }

  const ingredients = ingredientsRaw
    ? ingredientsRaw
        .split(/\r?\n|,/) 
        .map((ingredient) => ingredient.trim())
        .filter(Boolean)
    : []

  await prisma.recipe.create({
    data: {
      name,
      ingredients,
      instructions,
    },
  })

  revalidatePath('/')
  return { success: true }
}

export async function deleteRecipe(id: string) {
  if (!id) {
    return { error: 'Recipe id is required' }
  }

  await prisma.recipe.delete({
    where: { id },
  })

  revalidatePath('/')
  return { success: true }
}

export async function assignRecipeToDay(
  dateKey: string,
  recipeId: string | null
) {
  const planDate = toPlanDate(dateKey)

  await prisma.mealPlan.upsert({
    where: { planDate },
    update: {
      recipeId,
      eatOutDescription: null,
    },
    create: {
      planDate,
      recipeId,
      eatOutDescription: null,
    },
  })

  revalidatePath('/')
  return { success: true }
}

export async function assignEatOutToDay(dateKey: string, eatOutDescription?: string | null) {
  const planDate = toPlanDate(dateKey)
  const normalizedEatOutDescription = eatOutDescription?.trim() || 'Eat out'

  await prisma.mealPlan.upsert({
    where: { planDate },
    update: {
      recipeId: null,
      eatOutDescription: normalizedEatOutDescription,
    },
    create: {
      planDate,
      recipeId: null,
      eatOutDescription: normalizedEatOutDescription,
    },
  })

  revalidatePath('/')
  return { success: true }
}
