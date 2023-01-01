import { categoryArrToString } from "./category.mjs";
import { parseContact } from "../contact.mjs";
import { addContactToCategory } from "./add-to-category.mjs";
import { removeContactFromCategory } from "./remove-from-category.mjs";

export function updateContact(addressBook, contactNode, changedProperties) {
  // We only care about email, name and categories
  // if (changedProperties.DisplayName != null) {
  //   addressBook.contacts[contactNode.id].name = changedProperties.DisplayName.newValue;
  // }

  // changedProperties only tells us whether Primary/SecondaryEmail changes.
  // it won't tell us if categories or other email address got updated.
  // Let's just parse the vCard again so that nothing is left behind!
  const id = contactNode.id;
  const newContact = parseContact(contactNode);
  const oldContact = addressBook.contacts[id];
  // TODO: we could do some optimization here:
  const newCategories = new Set(newContact.categories.map(categoryArrToString));
  const oldCategories = new Set(oldContact.categories.map(categoryArrToString));
  console.log("Old categories: ", JSON.stringify([...newCategories]));
  console.log("New categories: ", JSON.stringify([...oldCategories]));
  if (
    newCategories.size != oldCategories.size ||
    [...newCategories].some((value) => !oldCategories.has(value))
  ) {
    // Categories changed.
    console.log("changed contact:", newContact, changedProperties);
    const addition = [...newCategories].flatMap((x) =>
      !oldCategories.has(x) ? [x.split(" / ")] : []
    );
    const deletion = [...oldCategories].flatMap((x) =>
      !newCategories.has(x) ? [x.split(" / ")] : []
    );
    console.log("Addition", addition);
    addition.forEach((cat) => addContactToCategory(addressBook, id, cat));
    console.log("Deletion", deletion);
    deletion.forEach((cat) => removeContactFromCategory(addressBook, id, cat));
  }
  addressBook.contacts[id] = newContact;
}
