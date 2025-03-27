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
import { MuiTheme } from '@/components/MuiTheme';
import { DatagridToolbar } from '@/components/DatagridToolbar';
import logo from '~assets/icon512.png';
import { AnalyticsEvent } from '@/misc/GA';

const webSnapchatLoginLink = 'https://accounts.snapchat.com/accounts/v2/login?continue=%2Faccounts%2Fsso%3Fclient_id%3Dweb-calling-corp--prod%26referrer%3Dhttps%253A%252F%252Fweb.snapchat.com%252F';

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
    field: 'ts',
    headerName: 'Date Added',
    width: 150,
    renderCell: (params: GridValueGetterParams) => {
      const dateTime = new Date(params.value).toLocaleDateString();
      return dateTime;
    },
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
      field: 'ts',
      sort: 'desc',
    },
  ]);
  // the selection model stores an array of IDs of the selected rows
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);

  useEffect(() => {
    if (stored) {
      setFilteredFriends(stored.friends.filter((friend) => friend.birthday));
    }
  }, [stored]);

  useEffect(() => {
    AnalyticsEvent([
      {
        name: 'page_view',
        params: {
          page: 'main',
        },
      },
    ]);
  });

  return (
    <ThemeProvider theme={MuiTheme}>
      <div className="w-full min-h-screen bg-black flex flex-col">
        <div className="flex flex-col justify-center items-center gap-4 mt-8 md:p-2">
          <div className="text-4xl  rounded-xl flex justify-center align-middle xl:w-2/3 w-full p-4 border border-white">
            <img src={logo} alt="logo" className="w-16 h-16 m-auto" />
            <div className="m-auto text-white flex-1 text-center font-light">
              Save Your Snapchat Friends&apos; Birthdays
            </div>
          </div>
          {
                stored && (
                  <>
                    <div className="xl:w-2/3 w-full p-4 flex justify-center align-middle rounded-xl border border-white">
                      <div className="w-full text-white flex justify-center align-middle">

                        <div className="text-xl text-gray-300 mr-4 flex items-center">
                          Last Updated:
                          {' '}
                          {new Date(stored?.storedAt).toLocaleDateString()}
                        </div>
                        <a href={webSnapchatLoginLink} target="_blank" rel="noreferrer">
                          <div className="btn bg-white text-black hover:bg-gray-200 shadow-none font-medium">
                            Update Now
                          </div>
                        </a>

                      </div>
                    </div>
                    <div className="xl:w-2/3 w-full">
                      {
              stored && (
                <DataGrid
                  className="bg-black h-fit border border-white rounded-xl"
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
                  sx={{
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: '#1a1a1a',
                      color: 'white',
                      fontWeight: 'bold',
                    },
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #333',
                    },
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: '#1a1a1a',
                    },
                    '& .MuiCheckbox-root': {
                      color: '#909090',
                    },
                    '& .MuiDataGrid-footerContainer': {
                      backgroundColor: '#1a1a1a',
                      borderTop: '1px solid #333',
                    },
                    '& .MuiTablePagination-root': {
                      color: 'white',
                    },
                  }}
                />
              )
            }
                    </div>
                  </>
                )
              }
        </div>
        {
          stored ? (
            <div className="flex-1" />
          ) : (
            <div className="flex-1 size-full flex justify-center align-middle">
              <div className="text-white text-center p-6 border border-white rounded-xl m-auto max-w-2xl">
                <h3 className="text-xl font-light mb-4">Welcome to the Snapchat Friends&apos; Birthday Tracker</h3>

                <p className="text-gray-300 mb-6">
                  This extension saves your Snapchat friends&apos; birthdays to your calendar so you never miss sending them
                  birthday wishes. You&apos;ll need to login to your Snapchat account to retrieve your friends&apos; data.
                </p>

                <div className="w-full h-px bg-white my-6" />

                <a href={webSnapchatLoginLink} className="m-auto">
                  <div className="btn bg-white text-black hover:bg-gray-200 shadow-none font-medium text-center uppercase">
                    LOGIN TO SNAPCHAT
                  </div>
                </a>
              </div>
            </div>
          )
        }

        <div className="text-center w-full p-4">
          <a href="https://j4a.uk/" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white">
            By J4a Industries
          </a>
        </div>
      </div>
      <dialog id="addToCalendarModal" className="modal">
        <div className="modal-box min-h-[20em] min-w-fit flex flex-col justify-center align-middle bg-black text-white border border-white">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-gray-400 hover:text-white">✕</button>
          </form>
          <h3 className="font-bold text-2xl mb-2">Your calendar has been downloaded.</h3>
          <div className="flex justify-center align-middle flex-1 gap-4 w-full m-auto">
            <div
              className="btn bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 flex justify-center align-middle min-h-[5em] flex-col m-auto"
              onClick={() => {
                window.addToCalendarModal.close();
                window.addCalendarToGoogleModal.showModal();
              }}
            >
              <div className="m-auto">Google Calendar</div>
              {
                typeof BiLogoGoogle === 'object' && <BiLogoGoogle className="w-8 h-8 m-auto" />
              }
            </div>
            <div
              className="btn bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 flex justify-center align-middle min-h-[5em] flex-col m-auto"
              onClick={() => {
                window.addToCalendarModal.close();
                window.addCalendarToOutlookModal.showModal();
              }}
            >
              <div className="m-auto">Outlook Calendar</div>
              {
                typeof PiMicrosoftOutlookLogoFill === 'object' && <PiMicrosoftOutlookLogoFill className="w-8 h-8 m-auto" />
              }
            </div>
            <div
              className="btn bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 flex justify-center align-middle min-h-[5em] flex-col m-auto"
              onClick={() => {
                window.addToCalendarModal.close();
                window.addCalendarToIcloudModal.showModal();
              }}
            >
              <div className="m-auto">Icloud Calendar</div>
              {
                typeof BiLogoApple === 'object' && <BiLogoApple className="w-8 h-8 m-auto" />
              }
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <dialog id="addCalendarToGoogleModal" className="modal">
        <div className="modal-box min-h-[20em] flex flex-col bg-black text-white border border-white">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-gray-400 hover:text-white">✕</button>
          </form>
          <h3 className="font-bold text-xl h-64 mb-4">
            Note: For notifications to work in google calendar, upload the file twice.
            {' '}
            <br />
            this will not add the birthdays twice.
            <br />
            <hr className="border-gray-700 my-4" />
          </h3>

          <div className="flex justify-center align-middle h-full flex-1 gap-4">
            <a href="https://calendar.google.com/calendar/u/0/r/settings/export" target="_blank" rel="noreferrer" className="m-auto">
              <div className="btn bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 flex justify-center align-middle min-h-[5em]">
                <div className="m-auto">Open Google Calendar</div>
                {
                  typeof BiLogoGoogle === 'object' && <BiLogoGoogle className="w-8 h-8 m-auto" />
                }
              </div>
            </a>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <dialog id="addCalendarToOutlookModal" className="modal">
        <div className="modal-box min-h-[20em] flex flex-col bg-black text-white border border-gray-800">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-gray-400 hover:text-white">✕</button>
          </form>
          <h3 className="font-bold text-xl h-64 mb-4">
            For notifications to work in outlook, you can only select 1 day before.
            <br />
            Selecting any other options will break the 1 day before notification.
            <br />
            <hr className="border-gray-700 my-4" />
          </h3>

          <div className="flex justify-center align-middle h-full flex-1 gap-4">
            <a href="https://outlook.office365.com/calendar/addcalendar" target="_blank" rel="noreferrer" className="m-auto">
              <div className="btn bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 flex justify-center align-middle min-h-[5em]">
                <div className="m-auto">Open Outlook Calendar</div>
                {
                  typeof PiMicrosoftOutlookLogoFill === 'object' && <PiMicrosoftOutlookLogoFill className="w-8 h-8 m-auto" />
                }
              </div>
            </a>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <dialog id="addCalendarToIcloudModal" className="modal">
        <div className="modal-box min-h-[20em] flex flex-col bg-black text-white border border-gray-800">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-gray-400 hover:text-white">✕</button>
          </form>
          <h3 className="font-bold text-xl h-64 mb-4">
            ICloud allows a maximum of 2 notifications per birthday.
            {' '}
            <br />
            <hr className="border-gray-700 my-4" />
            To add a calendar to your ICloud, the easiest way is to email it to yourself and open it on the default mail app.
            Otherwise if you are on a mac, you can open the calendar app and import it from there.
          </h3>

          <div className="flex justify-center align-middle h-full flex-1 gap-4">
            <a href="https://outlook.office365.com/" target="_blank" rel="noreferrer" className="m-auto">
              <div className="btn bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 flex justify-center align-middle min-h-[5em]">
                <div className="m-auto">Open Outlook</div>
                {
                  typeof PiMicrosoftOutlookLogoFill === 'object' && <PiMicrosoftOutlookLogoFill className="w-8 h-8 m-auto" />
                }
              </div>
            </a>
            <a href="https://mail.google.com/" target="_blank" rel="noreferrer" className="m-auto">
              <div className="btn bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 flex justify-center align-middle min-h-[5em]">
                <div className="m-auto">Open Gmail</div>
                {
                  typeof BiLogoGmail === 'object' && <BiLogoGmail className="w-8 h-8 m-auto" />
                }
              </div>
            </a>
            <a href="https://www.icloud.com/mail/" target="_blank" rel="noreferrer" className="m-auto">
              <div className="btn bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 flex justify-center align-middle min-h-[5em]">
                <div className="m-auto">Open Icloud Mail</div>
                {
                  typeof BiLogoApple === 'object' && <BiLogoApple className="w-8 h-8 m-auto" />
                }
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
