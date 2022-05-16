import {
  near,
  log,
  json,
  JSONValueKind,
  BigInt,
} from "@graphprotocol/graph-ts";
import { Proposal, Log, Vote } from "../generated/schema";

export function handleReceipt(receipt: near.ReceiptWithOutcome): void {
  const actions = receipt.receipt.actions;

  for (let i = 0; i < actions.length; i++) {
    handleAction(
      actions[i],
      receipt.receipt,
      receipt.block.header,
      receipt.outcome
    );
  }
}

function handleAction(
  action: near.ActionValue,
  receipt: near.ActionReceipt,
  blockHeader: near.BlockHeader,
  outcome: near.ExecutionOutcome
): void {
  if (action.kind != near.ActionKind.FUNCTION_CALL) {
    log.info("Early return: {}", ["Not a function call"]);
    return;
  }

  const receiptId = receipt.id.toBase58();
  let votes = new Vote(`${receiptId}`);
  let proposal = new Proposal(`${receiptId}`);
  const functionCall = action.toFunctionCall();

  // change the methodName here to the methodName emitting the log in the contract
  if (functionCall.methodName == "act_proposal") {
    log.info("log: {}", outcome.logs);
    // Maps the JSON formatted log to the LOG entity
    let logs = new Log(`${receiptId}`);
    if (outcome.logs[0] != null) {
      logs.id = receiptId;

      let parsed = json.fromString(outcome.logs[0].slice("EVENT_JSON:".length));
      if (parsed.kind == JSONValueKind.OBJECT) {
        let eventJSON = parsed.toObject();

        let dataIndex = 0;
        //standard, version, event (these stay the same for a NEP 171 emmitted log)
        for (let i = 0; i < eventJSON.entries.length; i++) {
          let key = eventJSON.entries[i].key.toString();
          switch (true) {
            case key == "standard":
              logs.standard = eventJSON.entries[i].value.toString();
              break;
            case key == "event":
              logs.event = eventJSON.entries[i].value.toString();
              break;
            case key == "version":
              logs.version = eventJSON.entries[i].value.toString();
              break;
            case key == "data":
              dataIndex = i;
              break;
          }
        }

        //data
        let data = eventJSON.entries[dataIndex].value.toArray()[0].toObject();
        for (let i = 0; i < data.entries.length; i++) {
          let key = data.entries[i].key.toString();
          // Replace each key with the key of the data your are emitting,
          // Ensure you add the keys to the Log entity and that the types are correct
          switch (true) {
            case key == "id":
              logs.proposal_id = data.entries[i].value.toString();
              votes.id = data.entries[i].value.toString();
              break;
            case key == "vote_option":
              logs.vote_option = data.entries[i].value.toString();
              votes.vote_option = data.entries[i].value.toString();
              break;
            case key == "user_weight":
              logs.user_weight = data.entries[i].value.toString();
              votes.user_weight = BigInt.fromString(
                data.entries[i].value.toString()
              );
              break;
          }
        }
      }
      logs.save();
    }

    votes.log.push(logs.id);
    votes.save();
  } else {
    log.info("Not processed - FunctionCall is: {}", [functionCall.methodName]);
  }

  // change the methodName here to the methodName emitting the log in the contract
  if (functionCall.methodName == "add_proposal") {
    let logs = new Log(`${receiptId}`);
    log.info("log: {}", outcome.logs);
    if (outcome.logs[0] != null) {
      let parsed = json.fromString(outcome.logs[0].slice("EVENT_JSON:".length));
      if (parsed.kind == JSONValueKind.OBJECT) {
        let eventJSON = parsed.toObject();

        let dataIndex = 0;
        //standard, version, event (these stay the same for a NEP 171 emmitted log)
        for (let i = 0; i < eventJSON.entries.length; i++) {
          let key = eventJSON.entries[i].key.toString();
          switch (true) {
            case key == "standard":
              logs.standard = eventJSON.entries[i].value.toString();
              break;
            case key == "event":
              logs.event = eventJSON.entries[i].value.toString();
              break;
            case key == "version":
              logs.version = eventJSON.entries[i].value.toString();
              break;
            case key == "data":
              dataIndex = i;
              break;
          }
        }

        //data
        let data = eventJSON.entries[dataIndex].value.toArray()[0].toObject();
        for (let i = 0; i < data.entries.length; i++) {
          let key = data.entries[i].key.toString();

          switch (true) {
            case key == "id":
              logs.proposal_id = data.entries[i].value.toString();
              proposal.id = data.entries[i].value.toString();
              break;
            case key == "proposer":
              logs.proposer = data.entries[i].value.toString();
              proposal.proposer = data.entries[i].value.toString();
              break;
            case key == "title":
              logs.title = data.entries[i].value.toString();
              proposal.title = data.entries[i].value.toString();
              break;
            case key == "description":
              logs.description = data.entries[i].value.toString();
              proposal.description = data.entries[i].value.toString();
              break;
            case key == "kind":
              logs.kind = data.entries[i].value.toString();
              proposal.kind = data.entries[i].value.toString();
              break;
            case key == "status":
              logs.status = data.entries[i].value.toString();
              proposal.status = data.entries[i].value.toString();
              break;
            case key == "submission_time":
              logs.submission_time = data.entries[i].value.toString();
              proposal.submission_time = BigInt.fromString(
                data.entries[i].value.toString()
              );
              break;
            case key == "proposal_start_time":
              logs.proposal_start_time = data.entries[i].value.toString();
              proposal.proposal_start_time = BigInt.fromString(
                data.entries[i].value.toString()
              );
              break;
            case key == "proposal_period":
              logs.proposal_period = data.entries[i].value.toString();
              proposal.proposal_period = BigInt.fromString(
                data.entries[i].value.toString()
              );
              break;
          }
        }
      }
      logs.save();
    }

    proposal.log.push(logs.id);
    proposal.save();
  } else {
    log.info("Not processed - FunctionCall is: {}", [functionCall.methodName]);
  }
}
