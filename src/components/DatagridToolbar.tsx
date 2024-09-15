import { useMemo, useState, type FC } from 'react';
import {
  GridToolbarContainer,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';
import type {
  GridRowSelectionModel,
} from '@mui/x-data-grid';
import { Button, type SelectChangeEvent } from '@mui/material';
import { AiOutlineDownload } from 'react-icons/ai';
import {
  createEvents, type EventAttributes, type DateArray, type Alarm,
} from 'ics';
import { RRule } from 'rrule';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import type { Friend } from '@/background/friendsType';
import { MuiTheme } from '@/components/MuiTheme';
import { AnalyticsEvent } from '@/misc/GA';

export type ToolbarProps = {
	selectionModel: GridRowSelectionModel;
	setSelectionModel: (newSelection: GridRowSelectionModel) => void;
	filteredFriends: Friend[];
}

enum AlarmTypes {
  day = '1 day before',
  week = '1 week before',
  twoWeeks = '2 weeks before',
  month = '1 month before',
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export const DatagridToolbar: FC<ToolbarProps> = (
  { selectionModel, setSelectionModel, filteredFriends },
) => {
  // add until should be set to current date + 5 years
  const [addUntil, setAddUntil] = useState<Date>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 5);
    return date;
  });

  const [selectedAlarms, setSelectedAlarms] = useState<AlarmTypes[]>([
    'week' as AlarmTypes,
  ]);

  const selectedFriends = useMemo(() => filteredFriends.filter((friend) => selectionModel.includes(friend.user_id)), [selectionModel, filteredFriends]);

  const canExport = useMemo(() => selectedFriends.length > 0, [selectedFriends]);

  const handleChange = (event: SelectChangeEvent<typeof selectedAlarms>) => {
    const {
      target: { value },
    } = event;

    // Map the selected strings to AlarmTypes enum values
    setSelectedAlarms(value as AlarmTypes[]);
  };

  const exportToCSV = async () => {
    const rows = selectedFriends.map((user) => {
      // Parse birthday string to get month and day
      const [month, day] = user.birthday.split('-').map(Number);

      // Create date for current year with parsed month and day
      const date = new Date();
      date.setFullYear(new Date().getFullYear(), month - 1, day);

      // Set the start time to midnight (00:00) of the birthday
      date.setHours(0, 0, 0, 0);

      // Create a row from birthday
      const rowAttribute = {
        Name: user.display,
        Username: user.name,
        Birthday: date.toLocaleDateString(),
        AddLink: `https://snapchat.com/add/${user.name}`,
      };
      
      return rowAttribute;
    });

    const fileName = 'SnapchatFriendsBirthdays.csv';

    const file: File = await new Promise((resolve, reject) => {
      const csvHeader = Object.keys(rows[0]).join(',');
      const csvContents = rows.map((row) => Object.values(row).join(',')).join('\n');
      const csv = `${csvHeader}\n${csvContents}`;
      const csvData = new Blob([csv], { type: 'text/csv' });
      resolve(new File([csvData], fileName, { type: 'text/csv' }));
    });

    const link = document.createElement('a');
    const url = URL.createObjectURL(file);

    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    AnalyticsEvent([
      {
        name: 'export',
        params: {
          amount: rows.length,
        },
      },
    ]);
  }

  const exportToCalendar = async () => {
    const alarms: Alarm[] = selectedAlarms.map((alarm) => {
      let outAlarm: Alarm = {};

      if (AlarmTypes[alarm] === AlarmTypes.day) {
        outAlarm = {
          trigger: {
            days: 1,
            before: true,
          },
        };
      }

      if (AlarmTypes[alarm] === AlarmTypes.week) {
        outAlarm = {
          trigger: {
            weeks: 1,
            before: true,
          },
        };
      }

      if (AlarmTypes[alarm] === AlarmTypes.twoWeeks) {
        outAlarm = {
          trigger: {
            weeks: 2,
            before: true,
          },
        };
      }

      if (AlarmTypes[alarm] === AlarmTypes.month) {
        outAlarm = {
          trigger: {
            weeks: 4,
            before: true,
          },
        };
      }

      return {
        action: 'display',
        description: 'Reminder of upcoming birthday',
        ...outAlarm,
      };
    });
    // creating a list of events from the selected friends
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
        alarms,
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

    const link = document.createElement('a');
    const url = URL.createObjectURL(file);

    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    window.addToCalendarModal.showModal();
    AnalyticsEvent([
      {
        name: 'export',
        params: {
          amount: events.length,
        },
      },
    ]);
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
      <FormControl sx={{ m: 1, width: 300 }}>
        <InputLabel id="demo-multiple-checkbox-label">Notifications Time</InputLabel>
        <Select
          labelId="demo-multiple-checkbox-label"
          id="demo-multiple-checkbox"
          multiple
          value={selectedAlarms}
          onChange={handleChange}
          input={<OutlinedInput label="Notifications Time" />}
          renderValue={(selected) => selected.map((value) => AlarmTypes[value]).reduce((acc, curr) => `${acc}, ${curr}`)}
          MenuProps={MenuProps}
        >
          {Object.keys(AlarmTypes).map((key) => (
            <MenuItem key={key} value={key}>
              <Checkbox checked={selectedAlarms.indexOf(key as AlarmTypes) > -1} />
              <ListItemText primary={AlarmTypes[key as AlarmTypes]} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <div className="flex-1" />
      <Button
        style={{
          backgroundColor: canExport ? MuiTheme.palette.secondary.dark : MuiTheme.palette.action.disabled,
          color: MuiTheme.palette.text.primary,
        }}
        variant="contained"
        startIcon={<AiOutlineDownload className="w-8 h-8" />}
        onClick={() => exportToCSV()}
        disabled={!canExport}
      >
        CSV
      </Button>
      <Button
        style={{
          backgroundColor: canExport ? MuiTheme.palette.primary.main : MuiTheme.palette.action.disabled,
          color: MuiTheme.palette.text.primary,
        }}
        variant="contained"
        startIcon={<AiOutlineDownload className="w-8 h-8" />}
        onClick={() => exportToCalendar()}
        disabled={!canExport}
      >
        Export Birthdays To Calendar (ICS)
      </Button>
    </GridToolbarContainer>
  );
};
