export interface CategoryFieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
  required: boolean;
  helper: string;
}

export interface CategoryConfig {
  guidance: string;
  fields: CategoryFieldDef[];
}

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  Technology: {
    guidance:
      'Strong Technology submissions describe a concrete technical problem or opportunity, identify the relevant systems or tools involved, and provide a realistic sense of the implementation effort. Focus on the problem and its impact — not just the solution.',
    fields: [
      {
        key: 'tech_stack',
        label: 'Tech Stack',
        type: 'text',
        required: true,
        helper:
          'List the technologies, languages, or platforms involved (e.g., "Next.js, PostgreSQL, Docker").',
      },
      {
        key: 'estimated_effort',
        label: 'Estimated Effort',
        type: 'select',
        options: ['< 1 week', '1–4 weeks', '1–3 months', '> 3 months'],
        required: true,
        helper: 'Rough implementation effort assuming a small team.',
      },
      {
        key: 'feasibility_notes',
        label: 'Feasibility Notes',
        type: 'textarea',
        required: false,
        helper: 'Any known technical risks, dependencies, or prerequisites.',
      },
    ],
  },

  'Process Improvement': {
    guidance:
      'Strong Process Improvement submissions clearly describe the current pain point, explain why existing approaches fall short, and propose a specific change that can be measured. The more concrete the before/after picture, the easier it is to evaluate.',
    fields: [
      {
        key: 'current_pain_point',
        label: 'Current Pain Point',
        type: 'textarea',
        required: true,
        helper: 'Describe the existing problem or inefficiency this idea addresses.',
      },
      {
        key: 'proposed_change',
        label: 'Proposed Change',
        type: 'textarea',
        required: true,
        helper: 'Explain the new process or workflow you are proposing.',
      },
      {
        key: 'affected_teams',
        label: 'Affected Teams',
        type: 'text',
        required: false,
        helper: 'Comma-separated list of teams or departments that would be impacted.',
      },
    ],
  },

  'Customer Experience': {
    guidance:
      'Strong Customer Experience submissions are grounded in a specific customer segment or use case. Describe who benefits, what they currently struggle with, and how your idea removes that friction. A measurable success metric makes the proposal much more compelling.',
    fields: [
      {
        key: 'target_audience',
        label: 'Target Audience',
        type: 'text',
        required: true,
        helper: 'Which customer segment or persona benefits from this idea?',
      },
      {
        key: 'expected_impact',
        label: 'Expected Impact',
        type: 'select',
        options: ['Low', 'Medium', 'High'],
        required: true,
        helper: 'Estimated effect on customer satisfaction or retention.',
      },
      {
        key: 'success_metric',
        label: 'Success Metric',
        type: 'text',
        required: false,
        helper: 'How would success be measured? (e.g., "NPS increase of 5 points").',
      },
    ],
  },

  Other: {
    guidance:
      'Use this category for ideas that do not fit neatly into Technology, Process Improvement, or Customer Experience. Provide as much context as possible so reviewers can understand the scope and value of your proposal.',
    fields: [
      {
        key: 'context',
        label: 'Additional Context',
        type: 'textarea',
        required: false,
        helper: 'Any background information that does not fit the other categories.',
      },
    ],
  },
};
