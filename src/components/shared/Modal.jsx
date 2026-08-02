import Icon from '../ui/Icon';

export default function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-navy">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="px-2 text-grayLight hover:text-grayDark"
          >
            <Icon name="close" size="md" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
