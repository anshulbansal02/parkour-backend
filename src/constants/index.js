const reMap = {
  name: /^[a-zA-Z]([a-zA-Z\s]{0,20})$/,
  username: /^(?=.{4,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/,
  email:
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
  password:
    /^(?=.*[A-Z].*[A-Z])(?=.*[!@#$&*])(?=.*[0-9].*[0-9])(?=.*[a-z].*[a-z].*[a-z]).{6}$/,
};

const alphaNumSet =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const mimeTypes = {
  image: [
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/svg+xml",
    "image/webp",
  ],
  video: ["video/mpeg", "video/mp4", "video/ogg", "video/webm"],
  get media() {
    return [...this.image, ...this.video];
  },
};

const food_facts = [
  "Added Sugar Is a Disaster",
  "mega-3 Fats Are Crucial and Most People Don’t Get Enough",
  "Artificial Trans Fats Are Very Unhealthy",
  "Eating Vegetables Will Improve Your Health",
  "It Is Critical to Avoid a Vitamin D Deficiency",
  "Refined Carbohydrates Are Bad for You",
  "Nuts Provide Healthy Fat and Energy",
  "Drinking six to eight glasses of water a day will help you stay hydrated",
];

const workout_facts = [
  "Music improves workout performance",
  "Exercising improves brain performance",
  "Working out sharpens your memory",
  "Running burns calories!",
  "More muscle mass = burning more fat while resting",
  "Exercise prevents signs of ageing",
  "A pound of muscle burns three times more calories than a pound of fat",
  "Workout Increases productivity",
  "Workouts can improve the look of your skin",
  "Exercising boosts self-confidence",
  "Working out enables you to sleep better",
];

module.exports = { reMap, alphaNumSet, mimeTypes, food_facts, workout_facts };
