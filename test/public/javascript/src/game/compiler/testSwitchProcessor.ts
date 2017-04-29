import Machine from '../../../../../../public/javascript/src/game/compiler/machine';
import mocha = require('mocha');
import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import chai = require('chai');
import * as sinon from 'sinon';
import {
    SwitchProcessor
} from './../../../../../../public/javascript/src/game/compiler/availableNodeProcessors';
import {
    AnyValueNode,
    ClassNode,
    SwitchComparisonNode,
    SwitchNode
} from './../../../../../../public/javascript/src/ast/availableNodes';
const expect = chai.expect;

let switchNode = new SwitchNode(new AnyValueNode("RIGHT"), 
            new SwitchComparisonNode(new AnyValueNode("UP"), 
                new AnyValueNode(false)),
            new SwitchComparisonNode(new AnyValueNode("RIGHT"),
                new AnyValueNode(true)),
            new SwitchComparisonNode(new AnyValueNode("LEFT"),
                new AnyValueNode(false))
        );

@suite("[SwitchProcessor] When requesting a node")
class CanHandle {
    machine : Machine;
    processor : SwitchProcessor;

    before() {
        this.machine = new Machine();
        this.processor = new SwitchProcessor(this.machine);
    }

    @test "it can handle, it should have responded with can handle"() {
        let result = this.processor.canHandle(switchNode);
        expect(result).to.be.true;
    }

    @test "it's not a ClassNode handle, it should have responded with cannot handle"() {
        let node = new AnyValueNode("class");
        let result = this.processor.canHandle(node);
        expect(result).to.be.false;
    }

    @test "it's null, it should have responded with cannot handle"() {
        let node = null;
        let result = this.processor.canHandle(node);
        expect(result).to.be.false;
    }
}

@suite("[SwitchProcessor] When requesting a node from the class processor")
class Process {
    machine : Machine;
    processor : SwitchProcessor;

    before() {
        this.machine = new Machine();
        this.processor = new SwitchProcessor(this.machine);
    }

    @test "a perfect class"() {       

        let result = this.processor.process(switchNode);
        expect(result).not.undefined;
        expect(result).not.null;
        expect(result).to.be.true;
    }

    @test "a non-matching switch"() {       
        let switchNode = new SwitchNode(new AnyValueNode("DOWN"), 
            new SwitchComparisonNode(new AnyValueNode("UP"), 
                new AnyValueNode(false)),
            new SwitchComparisonNode(new AnyValueNode("RIGHT"),
                new AnyValueNode(false)),
            new SwitchComparisonNode(new AnyValueNode("LEFT"),
                new AnyValueNode(false))
        );
        let result = this.processor.process(switchNode);
        expect(result).to.be.null;
    }
    
    @test "a default matcher for the switch"() {       
        let switchNode = new SwitchNode(new AnyValueNode("DOWN"), 
            new SwitchComparisonNode(new AnyValueNode("UP"), 
                new AnyValueNode(false)),
            new SwitchComparisonNode(new AnyValueNode("RIGHT"),
                new AnyValueNode(false)),
            new SwitchComparisonNode(new AnyValueNode("LEFT"),
                new AnyValueNode(false)),
            new SwitchComparisonNode(null,
                new AnyValueNode(true))
        );
        let result = this.processor.process(switchNode);
        expect(result).not.undefined;
        expect(result).not.null;
        expect(result).to.be.true;
    }
}