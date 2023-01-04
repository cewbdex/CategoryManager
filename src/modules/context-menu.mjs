import {
  SUBCATEGORY_SEPARATOR,
  isContactInCategory,
  isContactInAnySubcategory,
} from "./address-book/index.mjs";

function createMenu(properties) {
  return browser.menus.create({
    ...properties,
    contexts: ["tab"],
    viewTypes: ["popup"],
    documentUrlPatterns: ["moz-extension://*/popup/popup.html"],
  });
}

function createCheckBoxMenu({
  id,
  title,
  checked = false,
  parentId = undefined,
}) {
  return createMenu({
    id,
    title: `${checked ? "☑ " : "☐ "} ${title}`,
    type: "normal",
    parentId,
  });
}

export function destroyAllMenus() {
  browser.menus.removeAll();
}

const MENU_ADD_TO_TO = await browser.i18n.getMessage("menu.category.add_to_to");
const MENU_ADD_TO_CC = await browser.i18n.getMessage("menu.category.add_to_cc");
const MENU_ADD_TO_BCC = await browser.i18n.getMessage(
  "menu.category.add_to_bcc"
);
const MENU_DELETE_CATEGORY = await browser.i18n.getMessage(
  "menu.category.delete"
);

export function createMenuForCategoryTree(categoryElement) {
  createMenu({
    id: "addToTO",
    title: MENU_ADD_TO_TO,
  });
  createMenu({
    id: "addToCC",
    title: MENU_ADD_TO_CC,
  });
  createMenu({
    id: "addToBCC",
    title: MENU_ADD_TO_BCC,
  });
  if (!("uncategorized" in categoryElement.dataset)) {
    // Add an option to delete this category
    createSeparator();
    createMenu({ id: "deleteCategory", title: MENU_DELETE_CATEGORY });
  }
}

async function createCategoryEditingMenuRecursively(
  category,
  contactId,
  prefix = "",
  parentId = undefined
) {
  const menuId = prefix + category.name;
  const checked = isContactInCategory(category, contactId);
  const subCategories = Object.keys(category.categories);

  createCheckBoxMenu({
    id: menuId,
    title: category.name,
    checked,
    parentId,
  });

  // Add submenu entries.
  if (checked) {
    let remove_string_key = isContactInAnySubcategory(category, contactId)
      ? "menu.contact.context.remove_from_category_recursively"
      : "menu.contact.context.remove_from_category";
    createMenu({
      id: "@" + menuId.slice(1),
      title: await browser.i18n.getMessage(remove_string_key, category.name),
      parentId: menuId,
    });
  } else {
    createMenu({
      id: "%" + menuId.slice(1),
      title: await browser.i18n.getMessage("menu.contact.context.add_to_category", category.name),
      parentId: menuId,
    });
  }

  if (subCategories.length) {
    createSeparator(menuId);
    subCategories.sort();
    for (const catName of subCategories) {
      const subCategory = category.categories[catName];
      await createCategoryEditingMenuRecursively(
        subCategory,
        contactId,
        menuId + SUBCATEGORY_SEPARATOR,
        menuId
      );
    }
  }

  createSeparator(menuId);
  createMenu({
    id: "$" + menuId.slice(1),
    title: await browser.i18n.getMessage("menu.contact.context.add_to_new_sub_category", category.name),
    parentId: menuId,
  });
}

let separatorIdCounter = 0;
function createSeparator(parentId = undefined) {
  return createMenu({
    id: `separator-${separatorIdCounter++}`,
    type: "separator",
    parentId,
  });
}

export function createDispatcherForContactListContextMenu({
  onDeletion,
  onAddition,
}) {
  return async function (menuId) {
    const categoryStr = menuId.slice(1);
    switch (menuId.charAt(0)) {
      case "@":
        await onDeletion(categoryStr);
        break;
      case "$":
        await onAddition(categoryStr, true);
        break;
      case "%":
        await onAddition(categoryStr, false);
        break;
      case "#":
        console.error("This menu item should not be clickable!");
        break;
      default:
        console.error("Unknown menu id:", menuId);
        break;
    }
  };
}

const MENU_HEADER_TEXT = await browser.i18n.getMessage(
  "menu.contact.context.manage_categories_of_contact"
);

export async function createMenuForContact(addressBook, contactId) {
  // Symbols:
  //    @: remove from category
  //    #: normal category
  //    $: <new category>
  //    %: <this category>

  // Menu:
  // - Manage belonging categories
  // - Add to ...
  createMenu({
    id: "header",
    title: MENU_HEADER_TEXT,
    enabled: false,
  });

  let categories = Object.keys(addressBook.categories);
  if (categories.length) {
    createSeparator();
    categories.sort();

    for (const catName of categories) {
      const category = addressBook.categories[catName];
      // Add # prefix to avoid id conflicts
      await createCategoryEditingMenuRecursively(category, contactId, "#");
    }
  }

  createSeparator();

  createMenu({
    id: "$",
    title: await browser.i18n.getMessage("menu.contact.context.add_to_new_top_level_category"),
  });
}
