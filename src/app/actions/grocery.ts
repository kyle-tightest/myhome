'use server'

import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { revalidatePath } from 'next/cache'

const connectionString = process.env.DATABASE_URL || ''
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export async function getGroceryItems() {
  return await prisma.groceryItem.findMany({
    orderBy: [
      { needsRestock: 'desc' },
      { name: 'asc' }
    ]
  })
}

export async function addGroceryItem(formData: FormData) {
  const name = formData.get('name') as string
  const estimatedDaysStr = formData.get('estimatedDays') as string
  const estimatedDays = estimatedDaysStr ? parseInt(estimatedDaysStr) : 7

  if (!name) return { error: 'Name is required' }

  await prisma.groceryItem.create({
    data: {
      name,
      estimatedDays,
      needsRestock: false,
    }
  })
  
  revalidatePath('/')
  return { success: true }
}

export async function restockGroceryItem(id: string) {
  await prisma.groceryItem.update({
    where: { id },
    data: {
      lastStocked: new Date(),
      needsRestock: false
    }
  })
  
  revalidatePath('/')
}

export async function toggleNeedsRestock(id: string, needsRestock: boolean) {
  await prisma.groceryItem.update({
    where: { id },
    data: { needsRestock }
  })
  
  revalidatePath('/')
}

export async function deleteGroceryItem(id: string) {
  await prisma.groceryItem.delete({
    where: { id }
  })
  
  revalidatePath('/')
}
