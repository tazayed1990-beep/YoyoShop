import type { ReactNode } from 'react';

interface TableProps<T> {
  columns: { header: string; accessor: keyof T | ((item: T) => ReactNode); }[];
  data: T[];
  renderActions?: (item: T) => ReactNode;
}

function Table<T extends { id: any }>({ columns, data, renderActions }: TableProps<T>) {
  return (
    <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            {columns.map((col, index) => (
              <th key={index} scope="col" className="py-3 px-6">
                {col.header}
              </th>
            ))}
            {renderActions && <th scope="col" className="py-3 px-6 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
              {columns.map((col, index) => (
                <td key={index} className="py-4 px-6">
                  {typeof col.accessor === 'function' 
                    ? col.accessor(item) 
                    : String(item[col.accessor])}
                </td>
              ))}
              {renderActions && (
                <td className="py-4 px-6 text-right">
                  {renderActions(item)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;