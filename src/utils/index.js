function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function stringFields(fields, capitalize = false) {
  fields =
    typeof fields === "object" && fields !== null
      ? Object.keys(fields)
      : fields;

  fields = capitalize ? fields.map(capitalizeFirstLetter) : fields;

  return fields.reduce((s, v, i, a) => {
    if (i == a.length - 1) return `${s} and ${v}`;
    else return `${s}, ${v}`;
  });
}

module.exports = { stringFields };
