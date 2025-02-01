String.prototype.capitalizeFirstLetter = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.capitalizeEachLetter = function() {
  return this.toLowerCase()
    .split(" ")
    .map(function(word) {
      return word.capitalizeFirstLetter();
    })
    .join(" ");
};

String.prototype.subStringName = function() {
  return this.length >= 13 ? this.substring(0, 11) + "..." : this;
};

String.prototype.showFullName = function() {
  return this.length >= 15 ? this.substring(0, 15) + "..." : this;
};
