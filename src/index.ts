"use strict";
import * as mongodb from 'mongodb';

export *   from './lib/mongodb/connection';

import *  as dbpromises  from './lib/mongodb/utils/mongo-promises';



export var db = {
    connect: dbpromises.connect,
    close: dbpromises.close
};


