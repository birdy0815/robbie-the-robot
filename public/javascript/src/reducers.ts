import { ParsingService, WordService } from './ast/parser';
import {
    AnyValueNode,
    AssignmentNode,
    CallFunctionNode,
    FunctionNode,
    NumberNode,
    StringNode
} from './ast/availableNodes';
import { handleActions, Action } from 'redux-actions';
import { Action as RobotAction, ActionType, Direction, GameState, IState, Map, Robot } from './models';
import {
    DIE,
    UPDATE_ROBOT,
    PERFORM_ACTION,
    REMOVE_STATEMENT,
    SET_MAP,
    START,
    STOP,
    STORE_ACTION,
    WIN
} from './actions';
import RobotProcessor from './game/robot/processor';

const initialState: IState = {
    actions: [],
    gameState: GameState.STOP,
    robot: {
        position: { row: 0, column: 0 }
    },
    goal: {
        position: { row: 0, column: 0 }
    },
    map: {
        key: "",
        name: "",
        template: "",
        maxStars: 0,
        goals: [],
        size: {
            row: 0,
            column: 0
        },
        fields: []
    },
    events: []
};

export default handleActions<IState, Action<IState>>({
    [SET_MAP]: (state: IState, action: Action<Map>): IState => {
        console.log(`Map set to ${JSON.stringify(action.payload)}`);
        return {
            gameState: state.gameState,
            actions: state.actions,
            map: Object.assign({}, action.payload),
            robot: state.robot,
            goal: state.goal,
            events: [...state.events, { name: SET_MAP, body: action.payload }]
        };
    },
    [STORE_ACTION]: (state: IState, action: Action<RobotAction>): IState => {
        console.log(`Appending action ${action.payload}`);
        return {
            gameState: state.gameState,
            actions: [...state.actions, action.payload],
            map: state.map,
            robot: state.robot,
            goal: state.goal,
            events: [...state.events, { name: STORE_ACTION, body: action.payload }]
        };
    },
    [PERFORM_ACTION]: (state: IState, action: Action<RobotAction>): IState => {
        console.log(`Performing action ${ActionType[action.payload.type]} in direction ${Direction[action.payload.direction]}`);
        let robotProcessor = new RobotProcessor(state.map, state.robot);
        let robotAction = action.payload;

        let { robot, map } = state;
        switch (robotAction.type) {
            case ActionType.Movement:
                robot = robotProcessor.runNode(new ParsingService(
                    WordService
                        .create(`then move in the direction ${Direction[robotAction.direction].toLowerCase()}`))
                    .parse(), ActionType.Movement);
                robot.currentAction = robotAction;
                console.log(`Moving robot to field ${JSON.stringify(robot.position)}`);
                break;
            case ActionType.Attack:
                let fieldUnderAttack = robotProcessor.runNode(new ParsingService(
                    WordService
                        .create(`then attack in the direction ${Direction[robotAction.direction].toLowerCase()}`))
                    .parse(), ActionType.Attack);
                console.log(`Attacking field ${JSON.stringify(fieldUnderAttack)}`);
                robot = Object.assign({}, robot);
                robot.currentAction = robotAction;
                for (let i = 0; i < map.fields.length; i++) {
                    if (map.fields[i].position.column === fieldUnderAttack.position.column &&
                        map.fields[i].position.row === fieldUnderAttack.position.row) {                        
                        map.fields[i].durability--;
                        if (map.fields[i].durability < 1)
                            map.fields.splice(i, 1);
                    }
                }

                map = Object.assign({}, map);
                break;
            case ActionType.End:
                robot = Object.assign({}, robot);
                robot.currentAction = robotAction;
                break;
        }

        return {
            gameState: state.gameState,
            actions: state.actions,
            map: map,
            robot: robot,
            goal: state.goal,
            events: [...state.events, { name: PERFORM_ACTION, body: action.payload }]
        };
    },
    [UPDATE_ROBOT]: (state: IState, action: Action<Robot>): IState => {
        console.log(`Executing robot movement ${JSON.stringify(action.payload)}`);
        let robot = action.payload;

        return {
            gameState: state.gameState,
            actions: state.actions,
            map: state.map,
            robot: robot,
            goal: state.goal,
            events: [...state.events, { name: UPDATE_ROBOT, body: action.payload }]
        };
    },
    [REMOVE_STATEMENT]: (state: IState, action: Action<number>): IState => {
        console.log(`Removing Statement ${JSON.stringify(action.payload)}`);
        let movements = state.actions.filter((_, index) => {
            return index !== action.payload;
        })
        return {
            gameState: state.gameState,
            actions: movements,
            map: state.map,
            robot: state.robot,
            goal: state.goal,
            events: [...state.events, { name: REMOVE_STATEMENT, body: action.payload }]
        };
    },
    [START]: (state: IState, action: Action<Robot>): IState => {
        return {
            gameState: GameState.RUNNING,
            actions: state.actions,
            map: state.map,
            robot: state.robot,
            goal: state.goal,
            events: [...state.events, { name: START, body: action.payload }]
        };
    },
    [STOP]: (state: IState, action: Action<Robot>): IState => {
        return {
            gameState: GameState.STOP,
            actions: state.actions,
            map: state.map,
            robot: state.robot,
            goal: state.goal,
            events: [...state.events, { name: STOP, body: action.payload }]
        };
    },
    [DIE]: (state: IState, action: Action<Robot>): IState => {
        console.log("A loose was triggered!");
        return {
            gameState: GameState.LOOSE,
            actions: state.actions,
            map: state.map,
            robot: state.robot,
            goal: state.goal,
            events: [...state.events, { name: DIE, body: action.payload }]
        };
    },
    [WIN]: (state: IState, action: Action<boolean>): IState => {
        console.log("A win was triggered!");
        return {
            gameState: GameState.WIN,
            actions: state.actions,
            map: state.map,
            robot: state.robot,
            goal: state.goal,
            events: [...state.events, { name: WIN, body: action.payload }]
        };
    }
}, initialState);