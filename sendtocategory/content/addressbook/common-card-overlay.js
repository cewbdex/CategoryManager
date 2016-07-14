let loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
loader.loadSubScript("chrome://sendtocategory/content/category_tools.js");

jbCatMan.EditDialogInit = function () {
  jbCatMan.dump("Begin with EditDialogInit()",1);

  //Hide SOGo Category Tab and deactivate all SOGo update/sync functions - if installed
  if (jbCatMan.sogoInstalled) {
    let categoriesTabButton = document.getElementById("categoriesTabButton");
    if (categoriesTabButton) categoriesTabButton.style.display = 'none';

    //remove SOGo hook on OK Button
    if (OldEditCardOKButton && EditCardOKButton) {
      EditCardOKButton = OldEditCardOKButton
    } else {
      alert("Debug: Could not remove sogo listerner! This is bad!\n");
    }
  }

  jbCatMan.scanCategories(gEditCard.abURI);
  dump(gEditCard.abURI + "\n");
  dump(jbCatMan.data.abURI[gEditCard.card.directoryId] + "\n");

  jbCatMan.EditDialogAllCatsArray = jbCatMan.data.categoryList;
  jbCatMan.EditDialogCatsArray = [];
  try {
    jbCatMan.EditDialogCatsArray = gEditCard.card.getPropertyAsAString("Categories").split("\u001A");
  } catch (ex) {}  

  // add the combo boxes for each category
  for (let i = 0; i < jbCatMan.EditDialogCatsArray.length; i++) {
    jbCatMan.EditDialogAppendCategory(jbCatMan.EditDialogCatsArray[i]);
  }

  // add focus event on empty field
  let emptyField = document.getElementById("abCatManEmptyCategory");
  emptyField.addEventListener("focus", jbCatMan.EditDialogOnEmptyFieldFocus, false);  

  jbCatMan.dump("Done with EditDialogInit()",-1);
}





jbCatMan.EditDialogOnEmptyFieldFocus = function (event) {
  let newCategory = jbCatMan.EditDialogAppendCategory("");
  newCategory.focus();
  event.preventDefault = true;
}

jbCatMan.EditDialogOnCategoryBlur = function () {
  let value = this.inputField.value.replace(/(^[ ]+|[ ]+$)/, "", "g");
  if (value.length == 0) {
    this.parentNode.removeChild(this);
  }
}

jbCatMan.EditDialogOnCategoryChange = function () {
    if (this.selectedIndex == -1) { // text field was changed
        let value = this.inputField.value;
        if (value.length > 0) {
            if (jbCatMan.EditDialogAllCatsArray.indexOf(value) < 0) {
                jbCatMan.EditDialogAllCatsArray.push(value);
                let box = document.getElementById("abCatManCategories");
                let lists = box.getElementsByTagName("menulist");
                for (let i = 0; i < lists.length; i++) {
                    jbCatMan.EditDialogResetCategoriesMenu(lists[i]);
                }
            }
        }
    }
}



//triggered by OK Button
jbCatMan.EditDialogSave = function () {
  jbCatMan.dump("Begin with EditDialogSave()",1);

  let vbox = document.getElementById("abCatManCategories");
  let menuLists = vbox.getElementsByTagName("menulist");
  let catsArray = [];
  for (var i = 0; i < menuLists.length; i++) {
    let value = menuLists[i].inputField.value.replace(/(^[ ]+|[ ]+$)/, "", "g");
    if (value.length > 0 && catsArray.indexOf(value) == -1) {
      catsArray.push(value);
    }
  }
  jbCatMan.dump("Setting categories to: " + catsArray.join(","));

  jbCatMan.setCategoriesforCard(gEditCard.card, catsArray);
  jbCatMan.modifyCard(gEditCard.card);
  jbCatMan.dump("Done with EditDialogSave()",-1);
}

jbCatMan.EditDialogAppendCategory = function (catValue) {  
    let vbox = document.getElementById("abCatManCategories");
    let menuList = document.createElement("menulist");
    menuList.setAttribute("editable", true);
    menuList.addEventListener("blur", jbCatMan.EditDialogOnCategoryBlur, false);
    menuList.addEventListener("change", jbCatMan.EditDialogOnCategoryChange, false);
    menuList.addEventListener("command", jbCatMan.EditDialogOnCategoryChange, false);
    jbCatMan.EditDialogResetCategoriesMenu(menuList);
    menuList.value = catValue;
    vbox.appendChild(menuList);
    return menuList;
}

jbCatMan.EditDialogResetCategoriesMenu = function (menu) {
    let popups = menu.getElementsByTagName("menupopup");
    for (let i = 0; i < popups.length; i++) {
        menu.removeChild(popups[i]);
    }

    let menuPopup = document.createElement("menupopup");
    for (let k = 0; k < jbCatMan.EditDialogAllCatsArray.length; k++) {
        let item = document.createElement("menuitem");
        item.setAttribute("label", jbCatMan.EditDialogAllCatsArray[k]);
        menuPopup.appendChild(item);
    }
    menu.appendChild(menuPopup);
}







//Init on load
window.addEventListener("load", function() { jbCatMan.EditDialogInit(); }, false);

//Add eventlistener for OK Button to save changes
window.addEventListener("dialogaccept", function() { jbCatMan.EditDialogSave(); }, false);