// The app's data source. Screens import `repo` from here.
import type { Repository } from "./repository";
import { supabaseRepository } from "./supabaseRepository";

export const repo: Repository = supabaseRepository;
