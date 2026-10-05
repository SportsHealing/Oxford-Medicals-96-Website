import { supabase } from '../lib/supabase.ts'
import { sampleRepo } from './sample.ts'
import { createSupabaseRepo } from './supabaseRepo.ts'
import type { Repo } from './types.ts'

export const repo: Repo = supabase ? createSupabaseRepo(supabase) : sampleRepo
export type { Member, Photo, Tag } from './types.ts'
