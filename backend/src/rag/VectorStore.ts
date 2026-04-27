import mongoose, { Schema, model, type Document } from 'mongoose'

// ─── Job Roles Collection ─────────────────────────────────────────────────────

export interface IJobRole extends Document {
  jobTitle:            string
  requiredSkills:      string[]
  niceToHaveSkills:    string[]
  experienceYears:     number
  requiredSections:    string[]
  commonExperiences:   string[]
  industryContext:     string
  embedding:           number[]
}

const JobRoleSchema = new Schema<IJobRole>({
  jobTitle:          { type: String, required: true, index: true },
  requiredSkills:    [String],
  niceToHaveSkills:  [String],
  experienceYears:   Number,
  requiredSections:  [String],
  commonExperiences: [String],
  industryContext:   String,
  embedding:         [Number],
})

export const JobRoleModel = model<IJobRole>('JobRole', JobRoleSchema, 'job_roles')

// ─── Skill Taxonomy Collection ────────────────────────────────────────────────

export interface ISkillTaxonomy extends Document {
  skill:     string
  category:  string
  aliases:   string[]
  related:   string[]
  implies:   string[]
  embedding: number[]
}

const SkillTaxonomySchema = new Schema<ISkillTaxonomy>({
  skill:     { type: String, required: true, index: true },
  category:  String,
  aliases:   [String],
  related:   [String],
  implies:   [String],
  embedding: [Number],
})

export const SkillTaxonomyModel = model<ISkillTaxonomy>(
  'SkillTaxonomy',
  SkillTaxonomySchema,
  'skill_taxonomy',
)

// ─── Vector Search Helpers ────────────────────────────────────────────────────

/**
 * Run an Atlas Vector Search aggregation on a collection.
 * Falls back gracefully if the Atlas index is not configured (development).
 */
export async function vectorSearch<T>(
  collectionName: 'job_roles' | 'skill_taxonomy',
  queryEmbedding:  number[],
  limit = 3,
): Promise<T[]> {
  try {
    const collection = mongoose.connection.collection(collectionName)
    const pipeline   = [
      {
        $vectorSearch: {
          index:       'vector_index',
          path:        'embedding',
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit,
        },
      },
      { $project: { embedding: 0, _id: 0 } },
    ]

    const cursor = collection.aggregate(pipeline)
    return (await cursor.toArray()) as T[]
  } catch {
    // Atlas Vector Search not available — return empty (graceful dev fallback)
    return []
  }
}
