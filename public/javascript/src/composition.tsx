import { ApiGateway, Routes } from "./net/api";
import { Tutorial } from "./game/tutorial/intro";
declare const $: any;
import * as React from "react";
import Machine from "./game/compiler/machine";
import Panel from "./controls/panel";
import Board from "./game/board";
import Act from "./game/run";
import Notification from "./game/notification";
import { LevelForwarder, LevelRouter } from "./game/levels";
import { ImageLoader } from "./imagePreloader";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import {
    changeStatementCount,
    changeStatementOrdering,
    killRobot,
    performAction,
    removeStatement,
    setMap,
    startRobot,
    stopRobot,
    storeAction,
    updateRobot,
    win,
} from "./actions";
import { Action, GameState, Goal, IState, Map, Robot, WayOfInput, Event as EventBody } from "./models";

interface AppProps {
    gameState: GameState;
    robot: Robot;
    goal: Goal;
    map: Map;
    events: Event[];
    actions: Action[];
    dispatch: Dispatch<any>;
}

interface GameBoardState {
    actions?: Action[];
    robot?: Robot;
    goal?: Goal;
    map?: Map;
    gameState?: GameState;
    events?: EventBody[];
    boardCols: number;
    controlCols: number;
    editingMode: WayOfInput;
}

class Game extends React.Component<any, GameBoardState> {
    public boardColumn: HTMLDivElement;
    public controlsColumn: HTMLDivElement;

    public constructor() {
        super();
        this.state = {
            boardCols: 8,
            controlCols: 4,
            editingMode: WayOfInput.Click,
        };
    }

    public componentWillMount() {
        ApiGateway.get(new Routes.EditingMode())
            .then((result: any) =>
                this.setState((Object.assign(this.state, {
                    editingMode: result.way,
                })) as any),
        );
    }

    public componentDidMount() {
        this.setHeight();
        window.addEventListener("resize", () => setTimeout(() => this.setHeight(), 50));
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", () => setTimeout(() => this.setHeight(), 50));
    }

    public render() {
        console.log("Rendering Game");
        const { dispatch, robot, goal } = this.props;
        const level = LevelRouter.getCurrentLevel();
        return <div className="row">
            <ImageLoader />
            <div className={`col-sm-${this.state.boardCols}`} ref={(div) => this.boardColumn = div}>
                <Board
                    actions={this.props.actions}
                    robot={robot}
                    goal={goal}
                    gameState={this.props.gameState}
                    onMapSet={(map: Map) => dispatch(setMap(map))}
                    onWin={() => dispatch(win())}
                    level={level}
                    onRendered={() => this.setHeight()}
                />
            </div>
            <div className={`col-sm-${this.state.controlCols}`} ref="controls">
                <LevelForwarder
                    gameState={this.props.gameState}
                    level={level} />

                <Panel
                    actions={this.props.actions}
                    gameState={this.props.gameState}
                    map={this.props.map}
                    robot={this.props.robot}
                    events={this.props.events}
                    way={this.state.editingMode}
                    onMove={(movement: Action) => dispatch(storeAction(movement))}
                    onChangeStatementCount={(index: number, value: number) => dispatch(changeStatementCount({ index, count: value }))}
                    onActionOrderingChanged={(oldIndex: number, newIndex: number) => dispatch(changeStatementOrdering({ oldIndex, newIndex }))}
                    onRemoveStatement={(index: number) => dispatch(removeStatement(index))}
                    onUpdate={(movement) => {
                        dispatch(storeAction(movement));
                    }}
                    onStart={() => dispatch(startRobot())} />

                <Act
                    gameState={this.props.gameState}
                    actions={this.props.actions}
                    onDied={() => dispatch(killRobot())}
                    onComplete={() => dispatch(stopRobot())}
                    onExecuteAction={(action: Action) => dispatch(performAction(action))} />

                <Notification
                    gameState={this.props.gameState} />
            </div>
        </div>;
    }

    private setHeight() {
        const screenHeight = $(window).height() - ($("nav").height() || 0);
        const minBoardColumns = 5;

        const screenSize = getScreenSize();

        if (screenSize === ScreenSizes.xs) {
            $(".controls").css("height", (screenHeight * 0.2) + "px");
            $(this.boardColumn).css("overflow", "auto");
            const viewportHeight = screenHeight - ($(".controls").height() || 0);
            if ($(this.boardColumn).height() > viewportHeight) {
                $(this.boardColumn).css("height", viewportHeight + "px");
                setTimeout(() => this.setHeight(), 50);
            }
        } else {
            $(".controls").css("height", "50vh");
            $(this.boardColumn).css("overflow", "");
            if ($(this.boardColumn).height() > screenHeight && this.state.boardCols > minBoardColumns) {
                this.setState((Object.assign(this.state, { boardCols: this.state.boardCols - 1, controlCols: this.state.controlCols + 1 }) as any));
                setTimeout(() => this.setHeight(), 50);
            } else if ($(this.boardColumn).height() <= (screenHeight / 2) && this.state.controlCols > 2) {
                this.setState((Object.assign(this.state, { boardCols: this.state.boardCols + 1, controlCols: this.state.controlCols - 1 }) as any));
                setTimeout(() => this.setHeight(), 50);
            }
        }
    }
}

enum ScreenSizes {
    xs,
    sm,
    med,
}

const getScreenSize = () => {
    if ($(window).width() < 544) {
        return ScreenSizes.xs;
    } else if ($(window).width() >= 544 && $(window).width() < 768) {
        return ScreenSizes.sm;
    } else {
        return ScreenSizes.med;
    }
};

const mapStateToProps = (state: IState) => {
    console.log(`Mapping state "${JSON.stringify(state)}" to props`);
    return ({
        goal: state.goal,
        robot: state.robot,
        map: state.map,
        events: state.events,
        actions: state.actions,
        gameState: state.gameState,
    });
};

export default connect(mapStateToProps)(Game);