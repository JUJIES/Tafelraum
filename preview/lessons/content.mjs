// Original sample lessons, written for the public preview. All places and reports in the mystery are fictional.
export const lessons = [
  {
    id:'eclipse', title:'Chasing the shadow', subject:'Earth science', accent:'#7151a9', tint:'#eae1ff',
    kicker:'FIELD LAB   /   EARTH & SPACE', intro:'How can the Moon hide a star that is much bigger than it is?',
    caption:'LIGHT LAB 01', note:'Move the Moon across the line of sight.', labels:['Before alignment','In line','After alignment'],
    observations:['The Moon passes above the observer’s line of sight. Sunlight still reaches the observer.','Sun, Moon and observer line up. The Moon blocks the bright solar disc along this narrow line.','The shadow has moved past the observer. From here the Sun is visible again.'],
    questions:[['During a solar eclipse, which object is in the middle?',['Earth','The Moon','The Sun'],1,'The Moon crosses the line between Earth and the Sun.'],['Why can one town miss a total eclipse?',['It is outside the central shadow','The Sun stopped shining there','Earth has stopped turning'],0,'Only observers inside the narrow central shadow see totality.']],
  },
  {
    id:'map-room', title:'The map room', subject:'Mathematics', accent:'#116753', tint:'#d5efe1',kicker:'MAP STUDIO   /   SCALE & DISTANCE',
    caption:'SURVEY SHEET 02', note:'Compare the two marked trails. Each grid edge represents 250 m.', labels:['Show both','Ridge trail','River trail'],
    observations:['Both trails connect the same points. Count horizontal and vertical grid edges along each path.','The ridge route runs 4 edges east, then 2 north. Six edges at 250 m each make 1.5 km.','The river route runs 1 edge south, 4 east, then 3 north. Eight edges make 2 km.'],
    questions:[['How long is the six-edge ridge trail?',['0.6 km','1.5 km','2.5 km'],1,'6 × 250 m = 1,500 m, or 1.5 km.'],['At 15 minutes per kilometre, which route fits 25 minutes?',['Either trail','Only the river trail','Only the ridge trail'],2,'The ridge takes 22.5 minutes. The river takes 30 minutes.']],
  },
  {
    id:'dispatch',title:'The midnight dispatch',subject:'English',accent:'#a24d24',tint:'#f5ddc4',kicker:'NIGHT DESK   /   READING EVIDENCE',
    caption:'ARCHIVE FILE 03',note:'Open each record. Separate what someone observed from what you infer.',labels:['Harbour log','Radio note','Delivery slip'],
    observations:['23:40 · Harbour log: “Two short flashes from the east pier. Fog across the water. No vessel identified.”','23:43 · Radio note: “I heard an engine near the pier. I could not see the boat.” Signed by the night operator.','23:51 · Delivery slip: “One crate received at the east pier.” The sender and vessel fields are blank.'],
    questions:[['Which claim is directly supported?',['A ferry delivered the crate','Two flashes were seen','The radio operator saw the boat'],1,'The harbour log records two flashes. None of the records identifies a vessel.'],['Which headline respects the evidence?',['Ferry smuggles cargo','Captain signals for help','Crate received at east pier'],2,'The delivery slip confirms the crate and location. Motive and vessel remain unknown.']],
  },
];
