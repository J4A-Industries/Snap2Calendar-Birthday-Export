import Box from '@mui/material/Box';

import {
  DataGrid,
  GridToolbarQuickFilter,
  GridLogicOperator,
} from '@mui/x-data-grid';

export const DatagridToolbar = () => (
  <div
    className="h-16 w-full align-middle justify-center flex mx-4"
  >
    <GridToolbarQuickFilter
      className="m-auto"
      quickFilterParser={(searchInput: string) => searchInput
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value !== '')}
    />
  </div>
);
