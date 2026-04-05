export const Table = ({ headers, children }) => {
    return (
      <div className="bg-white shadow-md p-6 rounded-md w-full">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-hgreen text-white">
              {headers.map((header, index) => (
                <th key={index} className="border px-4 py-2">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {children}
          </tbody>
        </table>
      </div>
    );
  };