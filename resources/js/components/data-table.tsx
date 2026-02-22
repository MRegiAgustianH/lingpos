import React from 'react';

interface Column<T> {
    header: string; // Judul kolom
    accessor: keyof T; // Field dari object
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    renderAction?: (row: T) => React.ReactNode;
}

export function DataTable<T extends { id: number }>({
    columns,
    data,
    renderAction,
}: DataTableProps<T>) {
    return (
        <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
                <thead className="bg-muted">
                    <tr>
                        <th className="p-3 text-left">No</th>

                        {columns.map((col, index) => (
                            <th key={index} className="p-3 text-left">
                                {col.header}
                            </th>
                        ))}

                        {renderAction && (
                            <th className="p-3 text-left">Aksi</th>
                        )}
                    </tr>
                </thead>

                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length + 2}
                                className="p-4 text-center"
                            >
                                Tidak ada data
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr key={row.id} className="border-t">
                                <td className="p-3">{rowIndex + 1}</td>

                                {columns.map((col, colIndex) => (
                                    <td key={colIndex} className="p-3">
                                        {row[col.accessor] !== null
                                            ? String(row[col.accessor])
                                            : "-"}
                                    </td>
                                ))}

                                {renderAction && (
                                    <td className="p-3">{renderAction(row)}</td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
