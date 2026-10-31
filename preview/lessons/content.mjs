// Original sample lessons, written for the public preview. All places and reports in the mystery are fictional.
export const lessons = [
  {
    id:'eclipse', title:'Chasing the shadow', subject:'Earth science', accent:'#7151a9', tint:'#eae1ff',
    kicker:'FIELD LAB   /   EARTH & SPACE', intro:'How can the Moon hide a star that is much bigger than it is?',
    caption:'LIGHT LAB 01', note:'Move the Moon across the line of sight.', labels:['Before alignment','In line','After alignment'],
    observations:['The Moon passes above the observer’s line of sight. Sunlight still reaches the observer.','Sun, Moon and observer line up. The Moon blocks the bright solar disc along this narrow line.','The shadow has moved past the observer. From here the Sun is visible again.'],
    goal:'Use a model to explain why a solar eclipse is visible in some places and not others.',
    steps:[['Predict · 5 min','Sketch the order of the three bodies during a solar eclipse. Compare sketches with a partner.'],['Investigate · 12 min','Try all three Moon positions. Trace a line from the observer towards the Sun. Which position blocks the light?'],['Model · 13 min','Draw a second observer away from the shadow. Explain why the two observers see different things. The diagram is not to scale.'],['Share & check · 10 min','Trade sketches. Label the positions that produce a solar eclipse, then answer the two quiz questions. Challenge: why does the central shadow cover so little of Earth?'],['Exit ticket · 5 min','Answer the exit question in your own words. Use your diagram as evidence.']],
    questions:[['During a solar eclipse, which object is in the middle?',['Earth','The Moon','The Sun'],1,'The Moon crosses the line between Earth and the Sun.'],['Why can one town miss a total eclipse?',['It is outside the central shadow','The Sun stopped shining there','Earth has stopped turning'],0,'Only observers inside the narrow central shadow see totality.']],
    exit:'A friend says the Sun goes dark everywhere during an eclipse. Use the word “shadow” to explain what actually happens.',
  },
  {
    id:'map-room', title:'The map room', subject:'Mathematics', accent:'#116753', tint:'#d5efe1',kicker:'MAP STUDIO   /   SCALE & DISTANCE',
    intro:'Which path gets the survey team from camp to the lookout before the light fades?',
    caption:'SURVEY SHEET 02', note:'Compare the two marked trails. Each grid edge represents 250 m.', labels:['Show both','Ridge trail','River trail'],
    observations:['Both trails connect the same points. Count horizontal and vertical grid edges along each path.','The ridge route runs 4 edges east, then 2 north. Six edges at 250 m each make 1.5 km.','The river route runs 1 edge south, 4 east, then 3 north. Eight edges make 2 km.'],
    goal:'Use a map scale to calculate route length and justify a choice.',
    steps:[['Estimate · 5 min','Without measuring, predict which trail is shorter. Mark where a detour adds distance.'],['Measure · 12 min','Trace both trails on the map. Count edges, multiply by 250 m and convert both results to kilometres.'],['Decide · 13 min','At 1 km every 15 minutes, which routes fit a 25-minute limit? Show your calculation to a partner.'],['Compare & check · 10 min','Compare calculations with another pair, then answer both quiz questions. Challenge: invent a third route of exactly 2.5 km and describe its grid moves.'],['Exit ticket · 5 min','Explain the effect of changing the map scale. Include one recalculated distance.']],
    questions:[['How long is the six-edge ridge trail?',['0.6 km','1.5 km','2.5 km'],1,'6 × 250 m = 1,500 m, or 1.5 km.'],['At 15 minutes per kilometre, which route fits 25 minutes?',['Either trail','Only the river trail','Only the ridge trail'],2,'The ridge takes 22.5 minutes. The river takes 30 minutes.']],
    exit:'A new map uses 500 m per edge. Explain what changes in your calculations and what stays the same.',
  },
  {
    id:'dispatch',title:'The midnight dispatch',subject:'English',accent:'#a24d24',tint:'#f5ddc4',kicker:'NIGHT DESK   /   READING EVIDENCE',
    intro:'A light flashes at the harbour. What can the night editor actually put in tomorrow’s paper?',
    caption:'ARCHIVE FILE 03',note:'Open each record. Separate what someone observed from what you infer.',labels:['Harbour log','Radio note','Delivery slip'],
    observations:['23:40 · Harbour log: “Two short flashes from the east pier. Fog across the water. No vessel identified.”','23:43 · Radio note: “I heard an engine near the pier. I could not see the boat.” Signed by the night operator.','23:51 · Delivery slip: “One crate received at the east pier.” The sender and vessel fields are blank.'],
    goal:'Distinguish observation from inference and qualify an uncertain claim.',
    steps:[['Notice · 5 min','Read the harbour log. List two facts and one question it leaves open.'],['Investigate · 12 min','Read all three records. Write a two-sentence news brief. Underline one claim supported by two records.'],['Edit · 13 min','Exchange briefs. Ask your partner to replace one unsupported assertion with a phrase such as “may have” or “the record shows”.'],['Editorial meeting · 10 min','Read two headlines aloud. Vote on the most defensible one and name the record behind your vote. Use the quiz to check the difference between fact and inference.'],['Exit ticket · 5 min','Submit a headline, a caption, a source and an unanswered question.']],
    questions:[['Which claim is directly supported?',['A ferry delivered the crate','Two flashes were seen','The radio operator saw the boat'],1,'The harbour log records two flashes. None of the records identifies a vessel.'],['Which headline respects the evidence?',['Ferry smuggles cargo','Captain signals for help','Crate received at east pier'],2,'The delivery slip confirms the crate and location. Motive and vessel remain unknown.']],
    exit:'Write a headline and a one-sentence caption. Name the record supporting your headline and one fact you still need.',
  },
];
