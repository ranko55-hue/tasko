import { he } from '../../locales/he';
import { formatDate } from '../../lib/time';

const g = he.projectDetail.general;

function Tile({ label, value }) {
  return (
    <div className="rounded-xl bg-surface p-3">
      <div className="text-xs text-grayLight">{label}</div>
      <div className="mt-1 whitespace-pre-wrap font-bold text-navy">
        {value || he.common.none}
      </div>
    </div>
  );
}

// לשונית "כללי" של הפרויקט — אותה שפה עיצובית כמו לשונית הלקוח.
export default function ProjectGeneralTab({ project }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Tile label={g.address} value={project?.address} />
        <Tile label={g.sku} value={project?.sku} />
      </div>

      <Tile label={g.details} value={project?.details} />

      {project?.created_at && (
        <p className="px-1 text-sm text-grayLight">
          {g.addedOn.replace('{date}', formatDate(project.created_at))}
        </p>
      )}
    </div>
  );
}
