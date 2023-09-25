import { useStorage } from '@plasmohq/storage/hook';
import './style.css';
import { Storage } from '@plasmohq/storage';
import { useEffect, useState, type FC } from 'react';
import {
  DataGrid,
} from '@mui/x-data-grid';
import type {
  GridColDef,
  GridRowModesModel,
  GridValueGetterParams,
  GridRowSelectionModel,
  GridSortModel,
} from '@mui/x-data-grid';
import { BiLogoGoogle, BiLogoGmail, BiLogoApple } from 'react-icons/bi';
import { PiMicrosoftOutlookLogoFill } from 'react-icons/pi';
import { ThemeProvider } from '@mui/material';
import type { storedFriends } from '@/background/messages/getFriendsRequest';
import type { Friend } from '@/background/friendsType';
import 'https://www.googletagmanager.com/gtag/js?id=$PLASMO_PUBLIC_GTAG_ID';
import { MuiTheme } from '@/components/MuiTheme';
import { DatagridToolbar } from '@/components/DatagridToolbar';
import logo from '~assets/icon512.png';

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

/**
 * Here's where the datagrid columns are defined
 * The birthday has a valuegetter to get the date from the string
 * so it can be sorted, then it is rendered in a more readable format
 */
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

  // this state stores all the friends who have birthday records
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);

  // these are for the datagrid to function properly
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [sortModel, setSortModel] = useState<GridSortModel>([
    {
      field: 'birthday',
      sort: 'asc',
    },
  ]);
  // the selection model stores an array of IDs of the selected rows
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);

  useEffect(() => {
    if (stored) {
      setFilteredFriends(stored.friends.filter((friend) => friend.birthday));
    }
  }, [stored]);

  return (
    <ThemeProvider theme={MuiTheme}>
      <div className="w-full min-h-screen bg-gray-800 flex flex-col">
        <div className="flex flex-col justify-center items-center gap-2 mt-8">
          <div className="text-4xl bg-zinc-900 rounded-2xl flex justify-center align-middle lg:w-2/3 w-full p-4">
            <img src={logo} alt="logo" className="w-16 h-16 m-auto" />
            <div className="m-auto text-white flex-1 text-center">
              Save Your Snapchat Friends&apos; Birthdays
            </div>
          </div>
          <div className="bg-zinc-900 lg:w-2/3 w-full p-4 flex justify-center align-middle rounded-2xl">
            <div className="m-auto text-white flex gap-4 justify-center align-middle">
              {
								stored ? (
  <>
    <div className="m-auto text-xl">
      Last Updated:
      {' '}
      {new Date(stored?.storedAt).toLocaleDateString()}
    </div>
    <a href="https://web.snapchat.com/" target="_blank" rel="noreferrer">
      <div className="btn btn-primary">
        Update Now
      </div>
    </a>
  </>

								) : (
  <a href="https://web.snapchat.com/" target="_blank" rel="noreferrer">
    <div className="btn btn-primary">
      Click here to open snapchat&apos;s website, login and then come back here
    </div>
  </a>
								)
							}

            </div>

          </div>
          <div className="lg:w-2/3 w-full">
            {
							stored && (
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
							)
						}

          </div>
        </div>
        <div className="flex-1" />
        <div className="text-center w-full p-4">
          <a href="https://j4a.uk/" target="_blank" rel="noreferrer" className="text-white">
            By J4a Industries
          </a>
        </div>
      </div>
      <dialog id="addToCalendarModal" className="modal">
        <div className="modal-box min-h-[20em] min-w-fit flex flex-col justify-center align-middle">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-2xl mb-2">Your calendar has been downloaded.</h3>
          <div className="flex justify-center align-middle flex-1 gap-4 w-full m-auto">
            <div
              className="btn btn-secondary flex justify-center align-middle min-h-[5em] flex-col m-auto"
              onClick={() => {
                window.addToCalendarModal.close();
                window.addCalendarToGoogleModal.showModal();
              }}
            >
              <div className="m-auto">Google Calendar</div>
              <BiLogoGoogle className="w-8 h-8 m-auto" />
            </div>
            <div
              className="btn btn-secondary flex justify-center align-middle min-h-[5em] flex-col m-auto"
              onClick={() => {
                window.addToCalendarModal.close();
                window.addCalendarToOutlookModal.showModal();
              }}
            >
              <div className="m-auto">Outlook Calendar</div>
              <PiMicrosoftOutlookLogoFill className="w-8 h-8 m-auto" />
            </div>
            <div
              className="btn btn-secondary flex justify-center align-middle min-h-[5em] flex-col m-auto"
              onClick={() => {
                window.addToCalendarModal.close();
                window.addCalendarToIcloudModal.showModal();
              }}
            >
              <div className="m-auto">Icloud Calendar</div>
              <BiLogoApple className="w-8 h-8 m-auto" />
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <dialog id="addCalendarToGoogleModal" className="modal">
        <div className="modal-box min-h-[20em] flex flex-col">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-xl h-64 mb-4">
            Note: For notifications to work in google calendar, upload the file twice.
            {' '}
            <br />
            this will not add the birthdays twice.
            <br />
            <hr />
          </h3>

          <div className="flex justify-center align-middle h-full flex-1 gap-4">
            <a href="https://calendar.google.com/calendar/u/0/r/settings/export" target="_blank" rel="noreferrer" className="m-auto">
              <div className="btn btn-secondary flex justify-center align-middle min-h-[5em]">
                <div className="m-auto">Open Google Calendar</div>
                <BiLogoGoogle className="w-8 h-8 m-auto" />
              </div>
            </a>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <dialog id="addCalendarToOutlookModal" className="modal">
        <div className="modal-box min-h-[20em] flex flex-col">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-xl h-64 mb-4">
            For notifications to work in outlook, you can only select 1 day before.
            <br />
            Selecting any other options will break the 1 day before notification.
            <br />
            <hr />
          </h3>

          <div className="flex justify-center align-middle h-full flex-1 gap-4">
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
      <dialog id="addCalendarToIcloudModal" className="modal">
        <div className="modal-box min-h-[20em] flex flex-col">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-xl h-64 mb-4">
            ICloud allows a maximum of 2 notifications per birthday.
            {' '}
            <br />
            <hr />
            To add a calendar to your ICloud, the easiest way is to email it to yourself and open it on the default mail app.
            Otherwise if you are on a mac, you can open the calendar app and import it from there.
          </h3>

          <div className="flex justify-center align-middle h-full flex-1 gap-4">
            <a href="https://outlook.office365.com/" target="_blank" rel="noreferrer" className="m-auto">
              <div className="btn btn-secondary flex justify-center align-middle min-h-[5em]">
                <div className="m-auto">Open Outlook</div>
                <PiMicrosoftOutlookLogoFill className="w-8 h-8 m-auto" />
              </div>
            </a>
            <a href="https://mail.google.com/" target="_blank" rel="noreferrer" className="m-auto">
              <div className="btn btn-secondary flex justify-center align-middle min-h-[5em]">
                <div className="m-auto">Open Gmail</div>
                <BiLogoGmail className="w-8 h-8 m-auto" />
              </div>
            </a>
            <a href="https://www.icloud.com/mail/" target="_blank" rel="noreferrer" className="m-auto">
              <div className="btn btn-secondary flex justify-center align-middle min-h-[5em]">
                <div className="m-auto">Open Icloud Mail</div>
                <BiLogoApple className="w-8 h-8 m-auto" />
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
