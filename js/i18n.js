/* Daymark interface text. Every string the app shows lives in this file.

   To add a language (for example Uzbek "uz" or Russian "ru"):
   1. Copy the whole `en` block below, rename the key to the language code.
   2. Translate the values. Leave the {placeholders} as they are.
   3. A value may also be a function when a language needs plural forms:
        streakDays: function (v) { return v.n + (v.n === 1 ? ' день' : ' дней') }
   Anything missing from a language falls back to English.
   Dates and weekday names are translated by the browser automatically.
   The language is chosen from the device language; it can be forced by
   setting localStorage "daymark-lang" (the More screen shows a picker once
   more than one language exists). */
window.DAYMARK_I18N = {
  strings: {
    en: {
      langName: 'English',

      /* navigation */
      tabSheet: 'Sheet', tabToday: 'Today', tabLater: 'Later', tabProgress: 'Progress', tabMore: 'More',
      navLabel: 'Sections of the app',
      newItem: 'New item',
      savedLocal: 'Saved on this device only',

      /* shared */
      add: 'Add', save: 'Save', cancel: 'Cancel', del: 'Delete', edit: 'Edit', gotIt: 'Got it',
      all: 'All', filterBy: 'Filter by section',
      today: 'Today', tomorrow: 'Tomorrow', yesterday: 'Yesterday',
      everyDay: 'Every day',
      doneOf: '{done} of {total}',
      doneOfAria: '{done} of {total} done',
      editItem: 'Edit {title}',

      /* sheet */
      sheetEyebrow: 'Daily check-list',
      date: 'Date', total: 'Total',
      prevMonth: 'Previous month', nextMonth: 'Next month', thisMonth: 'This month',
      sectionName: 'Section name', noSection: 'No section',
      writeHere: 'Write a habit here', newRowIn: 'New row in {section}', rowName: 'Row name',
      rowOptions: 'Options for {title}', sectionOptions: 'Section options: {name}',
      sectionTitle: 'Section', nameLabel: 'Name', position: 'Position on the sheet',
      moveUpBtn: 'Move up', moveDownBtn: 'Move down', doneBtn: 'Done', deleteSectionBtn: 'Delete section',
      newSectionName: 'Section name (optional)', addSection: 'Add section',
      sheetHelp: 'Write on any empty line to add a row, then tap the squares to tick the days. Tap a name to change it, or ⋯ for more options.',
      printBtn: 'Print or save as PDF',
      sheetHelpPlain: 'Sections are optional: add one below if you want to group your rows.',
      sheetHelpSections: 'Tap a section name on the left edge to rename, move or delete it. Delete every section to get a plain sheet again.',
      welcome: 'This sheet works like the paper one. Write your habits on the empty lines, then tick the squares day by day.',
      cellLabel: '{title}, {date}',
      delSectionTitle: 'Delete this section?',
      delSectionEmpty: '"{name}" will be removed.',
      delSectionUsed: '"{name}" will be removed. Its {n} item(s) are kept and move to "No section".',

      /* today */
      habits: 'Habits', todo: 'To do',
      noHabitsDay: 'No habits on this day. Add one with New item and choose Every day.',
      noTodosDay: 'Nothing planned. Type below to add something.',
      addTodoFor: 'Add a to-do for {day}',
      todayLower: 'today',
      backToToday: 'Back to today',
      prevWeek: 'Previous week', nextWeek: 'Next week',
      streakDays: '{n} day streak',
      notYet: 'Not yet',
      overdueSince: 'Overdue since {date}',
      doneOn: 'Done {date}',

      /* later */
      openCount: '{n} open',
      addLater: 'Add something to do or decide later',
      overdue: 'Overdue', scheduled: 'Scheduled', noDate: 'No date', done: 'Done',
      scheduledEmpty: 'Nothing with a date. Give a to-do a date to see it here.',
      noDateEmpty: 'Park ideas, decisions and someday tasks here.',

      /* progress */
      lastFiveWeeks: 'Last five weeks',
      thisWeek: 'This week',
      doneSoFar: 'done so far', longestLive: 'longest live streak', openTodos: 'open to-dos',
      streak: 'streak', best: 'best', last30: 'last 30 days',
      noHabits: 'Add a habit to see its streak and history here.',
      howTitle: 'How it works',
      howBody: 'Habits come back on their days and build streaks. Sheet shows the whole month as a grid. To-dos happen once, and anything without a date waits in Later.',
      dayOf: '{date}: {done} of {total}',

      /* item form */
      editItemTitle: 'Edit item',
      what: 'What', whatPh: 'Name this habit or to-do',
      howOften: 'How often', once: 'Once', someDays: 'Some days',
      when: 'When', pickDate: 'Pick date', later: 'Later', dateLabel: 'Date',
      whichDays: 'Which days',
      section: 'Section', newSection: 'New section…',
      tapAgainDelete: 'Tap again to delete',

      /* more */
      moreEyebrow: 'Backup, install, share',
      installTitle: 'Install',
      installed: 'Daymark is installed on this device and opens without internet.',
      installBtn: 'Install Daymark',
      installHint: 'Windows (Chrome or Edge): open the browser menu and choose "Install Daymark" (in Edge: Apps, then "Install this site as an app"). Android (Chrome): menu, then "Add to Home screen" or "Install app". iPhone (Safari): Share button, then "Add to Home Screen".',
      backupTitle: 'Backup and transfer',
      backupBody: 'Your checklist is stored only on this device. Export it to a file to keep a backup or to move it to another device, then import that file there.',
      exportBtn: 'Export to file', importBtn: 'Import from file',
      lastExport: 'Last export: {date}', neverExported: 'No export made yet.',
      exported: 'Backup file created',
      importTitle: 'Replace everything on this device?',
      importBody: 'The backup from {date} holds {items} item(s) in {sections} section(s). It will replace all Daymark data on this device. This cannot be undone.',
      importUnknownDate: 'an unknown date',
      importOk: 'Replace', imported: 'Backup imported',
      importBad: 'That file is not a Daymark backup.',
      shareTitle: 'Share Daymark',
      shareBody: 'Send people this link. They get their own empty copy of the app; your checklist is never shared.',
      shareBtn: 'Share link', copyBtn: 'Copy link', copied: 'Link copied',
      shareText: 'Daymark, a daily check-list app',
      eraseTitle: 'Erase',
      eraseBody: 'Remove every section, item and tick from this device and start again.',
      eraseBtn: 'Erase all data',
      eraseConfirmTitle: 'Erase all data?',
      eraseConfirmBody: 'All sections, items and ticks on this device will be deleted. Export a backup first if you might want them back.',
      eraseOk: 'Erase', erased: 'All data erased',
      language: 'Language',
      version: 'Daymark {v}',

      /* system */
      saveFailed: 'Could not save. Storage on this device may be full or blocked.',
      updateReady: 'A new version of Daymark is ready.',
      reload: 'Reload'
    }
  },

  pick: function () {
    var saved = null;
    try { saved = localStorage.getItem('daymark-lang'); } catch (e) {}
    var nav = String(navigator.language || 'en').slice(0, 2).toLowerCase();
    return this.strings[saved] ? saved : this.strings[nav] ? nav : 'en';
  }
};
