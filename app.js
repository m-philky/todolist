//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require('lodash');
const dotenv = require('dotenv');
dotenv.config();


const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];
// use mongo and mongoose instead of arrays
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lgm15jb.mongodb.net/?retryWrites=true&w=majority`, {
  useNewUrlParser: true,
});

// create items schema
const itemsSchema = {
  name: String,
};
// create items model based on item schema from above
const Item = mongoose.model("Item", itemsSchema); // Items collection created here

const firstItem = new Item({
  name: "The first item",
});

const secondItem = new Item({
  name: "The second item",
});

const thirdItem = new Item({
  name: "The third item",
});

const defaultItems = [firstItem, secondItem, thirdItem];

// create list documents
const listSchema = {
  name: String,
  items: [itemsSchema],
};

// create list model from list schena
const List = mongoose.model("List", listSchema);

// insert items into Items collection
// Item.insertMany(defaultItems, function(error) {
//   if (error) {
//     console.log(`Error in inserting documents into Items ${error}`)
//   } else {
//     console.log(`Documents inserted successfully`)
//   }
// });

// get all items
app.get("/", function (req, res) {
  // const day = date.getDate();
  Item.find({}, (error, foundItems) => {
    if (foundItems.length === 0) {
      // insert items into Items collection
      Item.insertMany(defaultItems, function (error) {
        if (error) {
          console.log(`Error in inserting documents into Items ${error}`);
        } else {
          console.log(`Documents inserted successfully`);
        }
      });
    } else {
      console.log("items found successfully");

      foundItems.forEach((item, index) => {
        console.log(`Item #${index + 1} is: ${item.name}`);
      });

      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  // check to see if list is the standard list
  if (listName === "Today") {
    // save item into collection of items
    item.save();
    // redirect to root route
    res.redirect("/");
  } else {
    // serach for list document in Lists collection
    List.findOne({ name: listName }, (error, foundList) => {
      // push new item into array of items = items aray is defined from List schema
      foundList.items.push(item);
      // update foundList with new data
      foundList.save();
      // redirect to route where user came from
      res.redirect(`/${listName}`);
    });
  }

  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  // we need which list that we are deleting from
  const listName = req.body.listName;

  // check if we are on default list
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (error) => {
      if (error) {
        console.log(error);
      } else {
        console.log(`deleted item ${checkedItemId}`);
        res.redirect("/");
      }
    });    
  } 
  // if not
  else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
      if (!err) {
        res.redirect(`/${listName}`);
      }
    });
  }



});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (error, foundList) => {
    if (error) {
      console.log(error);
    } else {
      if (foundList) {
        // console.log('exists')
        // should show existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      } else {
        // console.log("dont exists")
        // should create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        // save into list collection
        list.save();
        res.redirect(`/${customListName}`);
      }
    }
  });
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
