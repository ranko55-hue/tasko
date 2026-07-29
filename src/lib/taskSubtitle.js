import { he } from '../locales/he';

// שורת המשנה של משימה — לקוח · פרויקט · כתובת.
// אם אין כתובת, המק"ט של הפרויקט תופס את מקומה; אם אין גם אותו,
// נשארים עם לקוח · פרויקט בלבד. חוק אחד, כדי שהמגירה והכרטיסים לא יתפצלו.
export function taskSubtitle(task) {
  const client = task?.client?.name;
  const project = task?.project?.name;
  const address = task?.address || task?.project?.address;
  const sku = task?.project?.sku;

  return [client, project, address || sku || null].filter(Boolean).join(' · ');
}

// גרסה קצרה לכרטיס: לקוח · פרויקט (בלי כתובת), ואם אין פרויקט — הלקוח בלבד
export function clientProjectLine(task) {
  const client = task?.client?.name ?? he.common.none;
  const project = task?.project?.name;
  return project ? `${client} · ${project}` : client;
}
