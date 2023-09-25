import { useEffect, useState, type FC } from 'react';
import {
  GridToolbarContainer,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';
import type {
  GridRowSelectionModel,
} from '@mui/x-data-grid';
import { Button } from '@mui/material';
import { AiOutlineDownload } from 'react-icons/ai';
import { createEvents, type EventAttributes, type DateArray } from 'ics';
import { RRule } from 'rrule';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import type { Friend } from '@/background/friendsType';
import 'https://www.googletagmanager.com/gtag/js?id=$PLASMO_PUBLIC_GTAG_ID';
import { MuiTheme } from '@/components/MuiTheme';

export type ToolbarProps = {
	selectionModel: GridRowSelectionModel;
	setSelectionModel: (newSelection: GridRowSelectionModel) => void;
	filteredFriends: Friend[];
}

export const DatagridToolbar: FC<ToolbarProps> = (
  { selectionModel, setSelectionModel, filteredFriends },
) => {
  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments) // eslint-disable-line
    };
    window.gtag('js', new Date());
    window.gtag('config', process.env.PLASMO_PUBLIC_GTAG_ID, {
      page_path: '/tabs/main',
    });
  }, []);

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
    window.gtag('event', 'CalendarCreated', {
      amount: events.length,
    });
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
          label="Repeat in calendar until"
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
