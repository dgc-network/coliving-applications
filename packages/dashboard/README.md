# Coliving Service Provider Dashboard

## Summary
Coliving Service Provider Dashboard allows users to register content nodes and discovery nodes, 
view their registered services & which ones are out date, and explore all coliving services.


## Running the Application
The application requires ethereum contracts.
You can run `npm run start:stage` which will use the contracts that are on the staging environment.
If you want to have contracts running locally, you'll also need to run this [setup script](https://github.com/dgc-network/coliving-protocol/tree/main/service-commands/scripts/setup.js) e.g. `node setup.js run eth-contracts up`

To start:
1. Install Dependencies `npm install`
2. Run the Application `npm run start:<environment>`

To Deploy:
Build the application using `npm run build` and serve the static `build` folder as a simple page app  
ex. `serve -s build`
 
