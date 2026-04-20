import MilestoneTable, { type Milestone } from '../../../components/sow/MilestoneTable';

interface Props {
  milestones: Milestone[];
  onChange: (milestones: Milestone[]) => void;
  totalSOWValue: number;
}

export default function MilestoneStep({ milestones, onChange, totalSOWValue }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Milestones & Payment Schedule</h3>
        <p className="text-xs text-gray-500 mb-4">
          Define milestones with deliverables, due dates, and payment amounts. Total payment must equal the SOW value.
        </p>
      </div>

      <MilestoneTable
        milestones={milestones}
        onChange={onChange}
        totalSOWValue={totalSOWValue}
      />
    </div>
  );
}
