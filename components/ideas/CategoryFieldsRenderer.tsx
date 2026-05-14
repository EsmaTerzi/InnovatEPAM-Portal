'use client';

import { TechnologyFields } from './fields/TechnologyFields';
import { ProcessImprovementFields } from './fields/ProcessImprovementFields';
import { CustomerExperienceFields } from './fields/CustomerExperienceFields';
import { OtherFields } from './fields/OtherFields';

interface Props {
  category: string;
  values: Record<string, string>;
  errors: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}

export function CategoryFieldsRenderer({
  category,
  values,
  errors,
  onChange,
  disabled,
}: Props) {
  const sharedProps = { values, errors, onChange, disabled };

  switch (category) {
    case 'Technology':
      return <TechnologyFields {...sharedProps} />;
    case 'Process Improvement':
      return <ProcessImprovementFields {...sharedProps} />;
    case 'Customer Experience':
      return <CustomerExperienceFields {...sharedProps} />;
    case 'Other':
      return <OtherFields {...sharedProps} />;
    default:
      return null;
  }
}
