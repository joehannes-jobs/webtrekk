import "angular";
import "angular-mocks/angular-mocks";

const context = require.context("./build", true, /\.spec\.js$/);

context.keys().forEach(context);
