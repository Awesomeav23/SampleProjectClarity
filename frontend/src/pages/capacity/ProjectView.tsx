import DataTable, { type Column } from '../../components/ui/DataTable';

interface ProjectCapacity {
  projectId: string;
  projectName: string;
  customerName: string;
  resourceCount: number;
  totalAllocationPercent: number;
  startDate: string;
  endDate: string;
  status: string;
  resources: { resourceId: string; resourceName: string; roleTitle: string; allocationPercent: number }[];
}

interface Props {
  data: ProjectCapacity[];
}

export default function ProjectView({ data }: Props) {
  const columns: Column<ProjectCapacity>[] = [
    { key: 'projectName', header: 'Project', sortable: true },
    { key: 'customerName', header: 'Customer', sortable: true },
    {
      key: 'resourceCount', header: 'Resources', sortable: true,
      render: (row) => <span className="font-medium">{row.resourceCount}</span>,
    },
    {
      key: 'totalAllocationPercent', header: 'Total Allocation', sortable: true,
      render: (row) => <span>{row.totalAllocationPercent}%</span>,
    },
    { key: 'startDate', header: 'Start', sortable: true },
    { key: 'endDate', header: 'End', sortable: true },
    {
      key: 'status', header: 'Status',
      render: (row) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      keyField="projectId"
      emptyMessage="No active projects"
    />
  );
}
