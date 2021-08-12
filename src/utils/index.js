function capitalizeFirstLetter(string = "") {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function stringFields(fields, capitalize = false, lastWord = "and") {
  fields = Array.isArray(fields) ? fields : Object.keys(fields);

  fields = capitalize ? fields.map(capitalizeFirstLetter) : fields;

  return fields.reduce((s, v, i, a) => {
    return i == a.length - 1 && lastWord
      ? `${s} ${lastWord} ${v}`
      : `${s}, ${v}`;
  });
}

function randomItem(array) {
  return array[randomNumber(0, array.length - 1)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateUsername(name, maxSeed = 999) {
  const names = name?.split(" ");
  const fName = names.splice(0, 1)[0];
  const rName = names.join("");

  return (
    randomItem([fName, fName.toLowerCase()]) +
    randomItem([".", "_", ""]) +
    randomItem([rName, rName[0], rName.toLowerCase(), ""]) +
    randomNumber(0, maxSeed)
  );
}

class FilterError extends Error {
  constructor(message) {
    this.message = message;
  }
}

function validateFilters(filters, params) {
  Object.keys(params).forEach((key) =>
    params[key] === undefined ? delete params[key] : {}
  );

  for (let param of Object.keys(params)) {
    const filter = filters[param];

    if (!filter) {
      continue;
    }

    switch (filter.type) {
      case Number:
        params[param] = +params[param];
        if (params[param] < filter.min || params[param] > filter.max) {
          throw new FilterError(
            `Query param '${param}' is not in range ${filter.min}-${filter.max}`
          );
        }
        break;
      case "Enumerator":
        params[param] = isNaN(+params[param]) ? params[param] : +params[param];
        if (!filter.values.includes(params[param])) {
          throw new FilterError(
            `Query param '${param}' is not one of ${stringFields(
              filter.values,
              false,
              "or"
            )}`
          );
        }
        break;
    }
  }

  const defaultParams = {};
  Object.keys(filters).forEach((filter) => {
    defaultParams[filter] = filters[filter].default;
  });

  return { ...defaultParams, ...params };
}

module.exports = {
  stringFields,
  validateFilters,
  randomItem,
  randomNumber,
  generateUsername,
};
