/** @format */

export const generateUsername = (
  fullName?: string,
  length: number = 6,
): string => {
  if (fullName) {
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0].toLowerCase();
    const lastName =
      nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : "";

    const baseName =
      firstName.substring(0, 3) + (lastName ? lastName.substring(0, 2) : "");

    const randomNum = Math.floor(Math.random() * 999) + 100;

    return baseName + randomNum;
  } else {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";

    const allChars = uppercase + numbers;

    let username = "";

    username += uppercase[Math.floor(Math.random() * uppercase.length)];
    username += numbers[Math.floor(Math.random() * numbers.length)];

    for (let i = username.length; i < length; i++) {
      username += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return username
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }
};
