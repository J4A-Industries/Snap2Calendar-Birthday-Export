import { useStorage } from '@plasmohq/storage/hook';
import './style.css';
import { Storage } from '@plasmohq/storage';
import { useEffect, useState, type FC } from 'react';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridLogicOperator,
} from '@mui/x-data-grid';
import type {
  GridColDef,
  GridRowModesModel,
  GridValueGetterParams,
  GridRowSelectionModel,
  GridSortModel,
} from '@mui/x-data-grid';
import { Button } from '@mui/material';
import { createTheme, type ThemeOptions, ThemeProvider } from '@mui/material/styles';
import { AiOutlineDownload } from 'react-icons/ai';
import { createEvent } from 'ics';
import { createEvents, type EventAttributes, type DateArray } from 'ics';
import { RRule } from 'rrule';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { BiLogoGoogle } from 'react-icons/bi';
import { PiMicrosoftOutlookLogoFill } from 'react-icons/pi';
import type { storedFriends } from '@/background/messages/getFriendsRequest';
import type { Friend } from '@/background/friendsType';

const themeDef: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#d926a9', // This is a lighter variant of the previous color
    },
    secondary: {
      main: '#8a56e2',
    },
    background: {
      default: '#1d232a',
      paper: '#2a323c',
    },
    text: {
      primary: '#ffffff', // Adjusted this to white color
    },
    success: {
      main: '#36d399',
    },
    warning: {
      main: '#fbbd23',
    },
    error: {
      main: '#f87272',
    },
    info: {
      main: '#1fb2a6',
    },
  },
};

export const MuiTheme = createTheme(themeDef);

// import { DatagridToolbar } from '@/components/datagridToolbar';

export type ToolbarProps = {
	selectionModel: GridRowSelectionModel;
	setSelectionModel: (newSelection: GridRowSelectionModel) => void;
	filteredFriends: Friend[];
}

export const DatagridToolbar: FC<ToolbarProps> = (
  { selectionModel, setSelectionModel, filteredFriends },
) => {
  // add until should be set to current date + 5 years
  const [addUntil, setAddUntil] = useState<Date>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 5);
    return date;
  });

  const exportToCalendar = async () => {
    // get all the selected friends from the filtered friends
    const selectedFriends = filteredFriends.filter((friend) => selectionModel.includes(friend.user_id));

    const events: EventAttributes[] = selectedFriends.map((user) => {
      // Parse birthday string to get month and day
      const [month, day] = user.birthday.split('-').map(Number);

      // Create date for current year with parsed month and day
      const date = new Date();
      date.setFullYear(new Date().getFullYear(), month - 1, day);

      // Set the start time to midnight (00:00) of the birthday
      date.setHours(0, 0, 0, 0);

      // Convert start and end times to DateArray
      const startDateArray: DateArray = [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      ];

      const endDateArray: DateArray = [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      ];

      // Create event attribute from birthday
      const eventAttribute: EventAttributes = {
        start: startDateArray,
        startInputType: 'local',
        end: endDateArray, // Set the end time to midnight of the day after the birthday
        title: `${user.display}'s birthday (${user.name})`,
        description: `${user.display}'s birthday - Exported by https://j4a.uk/`,
        url: `https://snapchat.com/add/${user.name}`,
        recurrenceRule: new RRule({
          freq: RRule.YEARLY,
          until: addUntil,
          bymonth: date.getMonth() + 1,
          bymonthday: date.getDate(),
        }).toString().split('RRULE:')[1],
      };

      return eventAttribute;
    });

    const fileName = 'SnapchatFriendsBirthdays.ics';

    const file: File = await new Promise((resolve, reject) => {
      createEvents(events, (error, value) => {
        if (error) {
          reject(error);
        }

        resolve(new File([value], fileName, { type: 'text/calendar' }));
      });
    });

    console.log(file);

    const link = document.createElement('a');
    const url = URL.createObjectURL(file);

    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    window.addToCalendarModal.showModal();
  };

  return (
    <GridToolbarContainer
			// add margin all around the toolbar
      className="m-2 flex justify-center align-middle"
    >
      <GridToolbarQuickFilter
        className="m-auto"
        quickFilterParser={(searchInput: string) => searchInput
          .split(',')
          .map((value) => value.trim())
          .filter((value) => value !== '')}
      />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          className="m-auto"
          label="Add Birthdays Until"
          views={['year']}
          value={dayjs(addUntil)}
          onChange={(newDate) => setAddUntil(new Date(newDate.valueOf()))}
          minDate={dayjs(new Date())}
        />
      </LocalizationProvider>
      <div className="flex-1" />
      <Button
        style={{
          backgroundColor: MuiTheme.palette.secondary.main, // uses the primary color as background
          color: MuiTheme.palette.text.primary, // uses the primary text color
        }}
        variant="contained"
        startIcon={<AiOutlineDownload className="w-8 h-8" />}
        onClick={() => exportToCalendar()}
      >
        Export Birthdays To Calendar
      </Button>
    </GridToolbarContainer>
  );
};

const dayWithSuffix = (date) => {
  if (date >= 11 && date <= 13) return `${date}th`;

  switch (date % 10) {
    case 1:
      return `${date}st`;
    case 2:
      return `${date}nd`;
    case 3:
      return `${date}rd`;
    default:
      return `${date}th`;
  }
};

const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Username',
    width: 200,
  },
  {
    field: 'display',
    headerName: 'Display Name',
    width: 250,
  },
  {
    field: 'birthday',
    headerName: 'Birthday',
    flex: 1,
    valueGetter: (params: GridValueGetterParams) => {
      const split = params.value.split('-');
      const month = split[0];
      const day = split[1];

      const dateTime = new Date(1970, parseInt(month, 10) - 1, parseInt(day, 10));

      return dateTime;
    },
    renderCell: (params: GridValueGetterParams) => {
      const datePart = params.value.toLocaleDateString(undefined, { month: 'long' });
      return `${dayWithSuffix(params.value.getDate())} of ${datePart.split(' ')[0]}`;
    },
  },
];

const main = () => {
  const [stored] = useStorage<storedFriends>({
    key: 'storedFriends',
    instance: new Storage({
      area: 'local',
    }),
  });

  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);

  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

  const [sortModel, setSortModel] = useState<GridSortModel>([
    {
      field: 'birthday',
      sort: 'asc',
    },
  ]);

  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);

  useEffect(() => {
    if (stored) {
      setFilteredFriends(stored.friends.filter((friend) => friend.birthday));
    }
  }, [stored]);

  return (
    <ThemeProvider theme={MuiTheme}>
      <div className="w-full min-h-screen bg-gray-800">
        <div className="flex flex-col justify-center items-center gap-2 mt-8">
          <div className="text-4xl bg-zinc-900 rounded-2xl flex justify-center align-middle lg:w-2/3 w-full p-4">
            <div className="m-auto text-white">
              Save Your Snapchat Friends&apos; Birthdays
            </div>
          </div>
          <div className="bg-zinc-900 lg:w-2/3 w-full m-4 p-4 flex justify-center align-middle">
            <div className="m-auto text-white grid grid-cols-2 grid-rows-1 gap-4 justify-center align-middle">
              {
								stored.storedAt && (
									<div className="m-auto text-xl">
  Last Updated:
  {' '}
  {new Date(stored?.storedAt).toLocaleDateString()}
									</div>
								)
							}

              <a href="https://web.snapchat.com/" target="_blank" rel="noreferrer">
                <div className="btn btn-primary">
                  Update Now
                </div>
              </a>
            </div>

          </div>
          <div className="lg:w-2/3 w-full m-4">
            <DataGrid
              className="bg-zinc-900 h-fit"
              rows={filteredFriends}
              columns={columns}
              getRowId={(row) => row.user_id}
              checkboxSelection
              rowSelectionModel={selectionModel}
              onRowSelectionModelChange={(newSelection) => {
                setSelectionModel(newSelection);
              }}
              rowModesModel={rowModesModel}
              onRowModesModelChange={(newModel) => {
                setRowModesModel(newModel);
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
              }}
              slots={{ toolbar: DatagridToolbar }}
              slotProps={{ toolbar: { selectionModel, setSelectionModel, filteredFriends } }}
              sortModel={sortModel}
              onSortModelChange={(newModel) => {
                setSortModel(newModel);
              }}
            />
          </div>
        </div>
      </div>
      <dialog id="addToCalendarModal" className="modal">
        <div className="modal-box min-h-[20em] flex flex-col">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-2xl">Add to your calendar</h3>
          <div className="flex justify-center align-middle h-full flex-1 gap-4">
            <a href="https://calendar.google.com/calendar/u/0/r/settings/export" target="_blank" rel="noreferrer" className="m-auto">
              <div className="btn btn-secondary flex justify-center align-middle min-h-[5em]">
                <div className="m-auto">Open Google Calendar</div>
                <BiLogoGoogle className="w-8 h-8 m-auto" />
              </div>
            </a>
            <a href="https://outlook.office365.com/calendar/addcalendar" target="_blank" rel="noreferrer" className="m-auto">
              <div className="btn btn-secondary flex justify-center align-middle min-h-[5em]">
                <div className="m-auto">Open Outlook Calendar</div>
                <PiMicrosoftOutlookLogoFill className="w-8 h-8 m-auto" />
              </div>
            </a>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </ThemeProvider>
  );
};

export default main;
