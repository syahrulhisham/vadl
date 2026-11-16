# VADL student guide

The Virtual Actuator and Drives Laboratory (VADL) is a browser laboratory for BELK 3423 Actuator
and Drives. It helps you prepare for, and revise after, the physical laboratory sessions; it does
not replace them. Every number on screen comes from a stated mathematical model with stated
assumptions, so read the assumptions before you trust a result.

## 1. What you need

- A current Chrome, Edge, Firefox or Safari on a laptop, desktop or tablet.
- Nothing to install and no account. Your work is saved **in this browser on this device only**.
  Nothing is sent to a server or to your lecturer.

## 2. Finding your way

The menu on the left (the **Menu** button on a tablet) has eight areas:

| Area                  | What it is for                                                          |
| --------------------- | ----------------------------------------------------------------------- |
| Welcome               | What VADL is and how to use it                                          |
| Laboratory overview   | The ten laboratories and the course learning outcomes they support      |
| Laboratory modules    | Open a laboratory                                                       |
| Learning resources    | Theory summaries, notation and worked examples (such as the RL circuit) |
| Experiment activities | How activities are organised: beginner, intermediate, advanced          |
| Assessment centre     | Practice sets drawn from all ten question banks                         |
| Student progress      | Your totals, back-up, restore and delete                                |
| Laboratory reports    | One report per laboratory, built from what you recorded                 |

## 3. Doing a laboratory

Each laboratory page has the same seven parts: objectives, theory, apparatus and model, controls,
workspace (diagram and graphs), measurements, and activities with questions.

1. Read the **objectives** and the **theory**, including the model's assumptions and limits.
2. Set the parameters in the **controls**. Some parameters can be changed only after **Reset**.
3. Press **Start**. **Pause** holds the run; **Stop** ends it; **Reset** returns to the start.
   **Playback speed** changes only how fast the screen animates, never the results.
4. Press **Record measurement** whenever the activity asks for a reading. Each press adds one row
   to the table with the time, the parameters and the measurements at that moment.
5. Work through the **activities** and answer the **questions**. Calculation questions use your
   generated numbers; the assessment centre draws new numbers each time it creates a set.

### Extra views in some laboratories

- **DC motor drives:** the workspace has three views. _Operating principle_ walks through how the
  motor turns in eight steps, with a construction explorer. _Drive waveforms_ shows the armature
  voltage and current of a converter over one supply cycle and which devices conduct.
- **Stepper and servo motors:** choose a part under the diagram to highlight it and read what it
  does. The servo laboratory also shows the encoder and resolver with their decoders.
- The operating-principle drawing is an illustration, not a measurement. Record readings from the
  measurement panels.

## 4. Questions and marking

- Multiple-choice, troubleshooting, sequence, table and calculation questions are marked at once.
- Multi-part calculations use **error carried forward**: if an early part is wrong but a later
  part is correct for your own earlier answer, the later part is accepted and the feedback says so.
- **Explanation** questions are marked by your lecturer. Your answer is saved and appears in your
  report; a marking guide is shown afterwards so you can check yourself.
- In the electro-pneumatics laboratory, **design tasks** check your ladder diagram by simulating
  it through test scenarios.

Scores in VADL are for **self-study only**. They are not official marks.

## 5. The assessment centre

Choose laboratories, a level and the number of questions, then **Create practice set**. To repeat
exactly the same set (for example one your lecturer gives the class), type its number in
**Set code (optional)** first. Answers are saved to their laboratories, so they count in your
progress and reports.

## 6. Reports

Open **Laboratory reports** and choose a laboratory. The report has ten sections: student
identification, experiment title, objectives, theory and equations, parameters, recorded
measurements, graphs, analysis and discussion, conclusion, and assessment results.

- Fill in your details and write your discussion and conclusion; they are saved as you type.
- The report shows only what you recorded. If a table is empty, go back and record measurements.
- **Print or save as PDF** opens the browser's print dialog; choose "Save as PDF" as the
  destination. **Download recorded data (CSV)** gives the measurements for a spreadsheet.

## 7. Keeping your work

Your work lives in this browser. It is lost if you clear the browser's site data, use a private
window, or change device. On **Student progress**:

- **Back up all my data** downloads a file `vadl-backup.json`. Keep it somewhere safe.
- **Restore from a backup** loads that file, on this or another device.
- **Delete all my VADL data…** removes everything after you confirm. It cannot be undone.

## 8. If something looks wrong

- A number you do not expect: check the parameters and the stated assumptions first; the model
  may not include the effect you have in mind.
- A page that does not respond: reload it. Saved work is kept.
- Report the problem to your lecturer with the laboratory, the parameters and what you expected.
