# NodeJS_ChatApp

### Software needed
**NodeJS**: We need NodeJS to run this app. Install it following the documentation in: [NodeJS website](https://nodejs.org/es/)<br>
**MongoDB**: The app stores the conversations in a MongoDB. Install MongoDB and learn how to run it on: [MongoDB website](https://www.mongodb.com/)

### Node Global Modules
The application has several bower dependencies listed in the ``` bower.json ``` file. To manage them we need to install Bower in as a global module.

```
  > npm install -g bower
```

[optional]

Install ``` nodemon ``` to avoid restarting the server after modifying application files

```
  > npm install -g nodemon
```

### Install the application dependencies
Clone the repository in the folder you want. Then open the console in the project folder and run the following commands:

```
  > npm install
  
  > bower install
  
```

### Run the app
Make sure you start your MongoDB process running: [Manage mongod Processes](https://docs.mongodb.com/manual/tutorial/manage-mongodb-processes/) 

If you installed ```nodemon```, just run in the console:

```
  > nodemon
```

Otherwise run:

```
  > node app.js
```
