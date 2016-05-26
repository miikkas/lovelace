/* If the exercise page content is empty when the script loads, add a title
   automatically. */
var content_untouched = false;
var content_input;
var page_title_elem;
var breadcrumb_elem;

function close_popup(popup) {
    popup.css({"opacity":"0", "pointer-events":"none"});
}

function close_popup_and_add_questions() {
    var TITLE_TEXT = "Deletes the relation between the feedback question and the exercise";
    var target_tbody = $("#feedback-question-table tbody");
    $("#add-feedback-table > tbody > tr").each(function(index) {
        if ($(this).find("input.feedback-question-checkbox:checked").length > 0) {
            var question = $(this).find("label.feedback-question-label").text();
            var in_table = false;
            target_tbody.find("td.question-cell").each(function() {
                if ($(this).html() === question) {
                    in_table = true;
                    return false;
                }
            });
            if (in_table) {
                return;
            }
            var type = $(this).children("td.type-cell").text();
            var tr = $('<tr>');
            var td_delete = $('<td class="delete-cell">');
            tr.append('<td class="question-cell">' + question + '</td>');
            tr.append('<td class="type-cell">' + type + '</td>');
            td_delete.append('<button class="delete-button" title="' + TITLE_TEXT + '" onclick="delete_feedback_from_table(this);">x</button>');
            tr.append(td_delete);
            target_tbody.append(tr);
        }
    });
    close_popup($("#edit-feedback-popup"));
}

$(document).ready(function() {
    content_input = $('#exercise-page-content');
    page_title_elem = $('title');
    breadcrumb_elem = $('#exercise-name-breadcrumb');
    var content_html = content_input.html();
    if (content_html === '' || content_html === undefined) {
        content_untouched = true;
    }
    $('div.feedback-table-div').slimScroll({
        height: '225px'
    });
    $('.popup').click(function() {
        close_popup($(this));
    });
    $('.popup > div').click(function(event) {
        event.stopPropagation();
    });
    $('input[type=text].exercise-tag-input').each(function () {
        change_tag_width(this);
        if (this.value === "") {
            remove_tag(this);
        }
    });
});

function highlight_parent_li(input_elem) {
    var input = $(input_elem);
    var parent = input.parent();
    var hilight_class = 'exercise-tag-input-hilighted';
    
    parent.toggleClass(hilight_class, true);
    input.focusout(function() {
        if (input.val() === '') {
            remove_tag(input[0]);
        } else if (!parent.is(':hover')) {
            parent.toggleClass(hilight_class, false);
        }
    });
    parent.hover(function() {
        parent.toggleClass(hilight_class, true);
    }, function() {
        if (!input.is(':focus')) {
            parent.toggleClass(hilight_class, false);
        }
    });
}

function change_tag_width(input_elem) {
    var CHAR_WIDTH = 9;
    var MAX_FITTING_LENGTH = 4;
    var input = $(input_elem);
    var val_len = input.val().length;
    
    if (val_len > MAX_FITTING_LENGTH) {
        input.width((input_elem.value.length * CHAR_WIDTH) + 'px');
    } else {
        input.width(input.css('min-width'));
    }
}

function add_tag() {
    var ul = $('ul.exercise-tags');
    var li = $('<li class="exercise-tag">');
    var tag_n = ul.children().length + 1;

    var new_tag = $('<input type="text" id="exercise-tag-' + tag_n + '" class="exercise-tag-input" name="exercise_tag_' + tag_n + '" value="?" maxlength="32" onfocus="highlight_parent_li(this);" oninput="change_tag_width(this);">');
    var new_button = $('<button type="button" class="delete-button" onclick="remove_tag(this);">x</button>');
    li.append(new_tag);
    li.append(new_button);
    ul.append(li);
}

function remove_tag(tag_elem) {
    var li = $(tag_elem).parent();
    li.remove();
    
    var ul = $('ul.exercise-tags');
    ul.children().each(function(index, element) {
        $(element).find("input[type=text].exercise-tag-input").attr({
            id: 'exercise-tag-' + (index + 1),
            name: 'exercise_tag_' + (index + 1)
        });
    });
}

function exercise_name_changed(e) {
    var new_name = e.target.value;

    /* TODO: 'Add' instead of 'Edit' when adding a new page */
    page_title_elem.html('Edit | ' + new_name);
    breadcrumb_elem.html(new_name);

    if (content_untouched === true) {
        content_input.html('== ' + new_name + ' ==\n\n')
    }
}

function exercise_page_content_changed(e) {
    content_untouched = false;
}

function test_name_changed(e) {
    var input_id = e.target.id;
    var split_id = input_id.split("-");
    var new_name = e.target.value;

    $('#test-' + split_id[1]).html(new_name);
}

function stage_name_changed(e) {
    var input_id = e.target.id;
    var split_id = input_id.split("-");
    var new_name = e.target.value;

    $('#stage-' + split_id[1]).html(new_name);
}

function command_name_changed(e) {
    var input_id = e.target.id;
    var split_id = input_id.split("-");
    var new_name = e.target.value;

    $('#command-' + split_id[1]).html(new_name);
}

function add_scrolling_to_choices_if_overflow(choices_div, choice_container_div) {
    var max_height = choices_div.css('max-height');
    if (choice_container_div.height() + 'px' === max_height) {
        choices_div.slimScroll({
            height: max_height
        });
        return true;
    } else {
        return false;
    }
}

function remove_scrolling_from_choices(choices_div, choice_container_div) {
    choices_div.slimScroll({
        destroy: true
    });
    choice_container_div.height(0);
    choices_div.height(0);
    choice_container_div.css({"height" : "auto"});
    choices_div.css({"height" : "auto"});
}

function add_feedback_choice(id_prefix, name_prefix, container_div_id, choices_div_id, named, choice_val) {
    var TITLE_TEXT = "Deletes an answer choice of a feedback question";

    var choice_container_div = $('#' + container_div_id);
    var choices_div = $('#' + choices_div_id);
    var label_n = choices_div.children().length + 1;
    var choice_div = $('<div id="' + id_prefix + '-div-' + label_n + '" class="feedback-choice-div">');
    var new_label = $('<label class="feedback-choice-label" for="' + id_prefix + '-' + label_n + '">');
    var delete_params = [id_prefix, name_prefix, container_div_id, choices_div_id, label_n, named].join("', '")
    var input = $('<input type="text" id="' + id_prefix + '-' + label_n + '" class="feedback-choice">');

    new_label.append('<span class="feedback-choice-span">Choice ' + label_n + ':</span>');
    if (typeof choice_val !== "undefined") {
        input.val(choice_val);
    }
    if (named) {  
        input.attr("name", name_prefix + "_{" + label_n + "}");
    } else if (label_n <= 2) {
        input.attr("oninput", "update_create_feedback_button_state();");
    }
    new_label.append(input);
    if (label_n > 2) {
        new_label.append('<button type="button" class="delete-button" title="' + TITLE_TEXT +
                         '" onclick="delete_feedback_choice(\'' + delete_params + '\');">x</button>');
    }
    
    choice_div.append(new_label);
    choice_div.append('<div id="' + id_prefix + "-" + label_n + '-error" class="admin-error"></div>');
    choices_div.append(choice_div);
    
    if (!add_scrolling_to_choices_if_overflow(choices_div, choice_container_div)) {
        remove_scrolling_from_choices(choices_div, choice_container_div);
    }
}

function add_choice_to_selected_feedback() {
    var choices_div = $("#feedback-choice-container > div.feedback-choices:visible");
    var choices_div_id = choices_div.attr("id");
    var question_id = choices_div.attr("data-feedback-question-id");
    var choice_count = choices_div.children().length;
    add_feedback_choice("feedback-choice-" + question_id, "choice_field_[" + question_id + "]", "feedback-choice-container", choices_div_id, true);
}

function delete_feedback_choice(id_prefix, name_prefix, container_div_id, choices_div_id, label_n, named) {
    var choice_container_div = $('#' + container_div_id);
    var choices_div = $('#' + choices_div_id);
    var choice_div = $('#' + id_prefix + '-div-' + label_n);
    var total_height = 0;
    var max_height = parseFloat(choices_div.css('max-height').replace("px", ""));
    var next_choices = choice_div.nextAll();
    var choice_values = [];

    next_choices.each(function() {
        choice_values.push($(this).find("input[type=text].feedback-choice").val());
    });

    choice_div.remove();
    next_choices.remove();
    $.each(choice_values, function(index, value) {
        add_feedback_choice(id_prefix, name_prefix, container_div_id, choices_div_id, named);
        choices_div.children().last().find("input[type=text].feedback-choice").val(value);
    });
    
    $("div.feedback-choice-div").each(function() {
        total_height += $(this).height();
    });
    if (total_height < max_height) {
        remove_scrolling_from_choices(choices_div, choice_container_div);
    }
}

function handle_feedback_type_selection(select) {
    var CHOICE_ID_PREFIX = 'new-feedback-choice';
    var CHOICE_NAME_PREFIX = 'choice_field';
    var CONTAINER_DIV_ID = 'new-feedback-choice-container';
    var CHOICES_DIV_ID = 'new-feedback-choices';
    
    var option = select.options[select.selectedIndex];
    var choice_container_div = $('#' + CONTAINER_DIV_ID);
    var choices_div = $('#' + CHOICES_DIV_ID);
    var add_choice_button = $('#add-new-feedback-choice');
    
    if (option.value === "MULTIPLE_CHOICE_FEEDBACK") {
        choice_container_div.css({"display": "block"});
        add_choice_button.css({"display": "inline-block"});
        add_feedback_choice(CHOICE_ID_PREFIX, CHOICE_NAME_PREFIX, CONTAINER_DIV_ID, CHOICES_DIV_ID, false);
        add_feedback_choice(CHOICE_ID_PREFIX, CHOICE_NAME_PREFIX, CONTAINER_DIV_ID, CHOICES_DIV_ID, false);
    } else {
        choice_container_div.hide();
        choices_div.empty();
        add_choice_button.hide();
    }
}

function select_all_feedback_questions(select) {
    $("td.question-cell > input[type=checkbox].feedback-question-checkbox").prop("checked", select);
}

function show_feedback_question_edit_menu(question_id) {
    var MENU_TITLE = "Edit feedback question: "

    var choice_container_div = $("#feedback-choice-container");
    var add_choice_button = $("#add-feedback-choice");
    var choices_div = $("#feedback-choices-" + question_id);

    $("#edit-feedback-question-inputs > div").hide();
    $("#feedback-question-input-div-" + question_id).css({"display" : "block"});
    $("#edit-feedback-div").css({"display" : "block"});
    $("#create-feedback-div").hide();
    $("#edit-feedback-div-title").text(MENU_TITLE + $("#feedback-question-" + question_id + "-label").text());
    
    if (choices_div.length > 0) {
        var all_choices_divs = $("#feedback-choice-container div.feedback-choices");
        choice_container_div.css({"display" : "block"});
        all_choices_divs.hide();
        choices_div.css({"display" : "block"});
        remove_scrolling_from_choices(all_choices_divs, choice_container_div);
        add_scrolling_to_choices_if_overflow(choices_div, choice_container_div);
        add_choice_button.css({"display" : "inline-block"});
    } else {
        choice_container_div.hide();
        add_choice_button.hide();
    }
}

function close_edit_feedback_menu() {
    $("#edit-feedback-div").hide();
    $("#create-feedback-div").css({"display" : "block"});
}

function add_feedback_choices_to_popup(question_id, choices) {
    var CHOICE_ID_PREFIX = 'feedback-choice-' + question_id;
    var CHOICE_NAME_PREFIX = 'choice_field_[' + question_id + ']';
    var CONTAINER_DIV_ID = 'feedback-choice-container';
    var CHOICES_DIV_ID = 'feedback-choices-' + question_id;
    
    var choice_container_div = $('#' + CONTAINER_DIV_ID);
    var choices_div = $('<div id="' + CHOICES_DIV_ID + '" class="feedback-choices" data-feedback-question-id="' + question_id + '">');
    choice_container_div.append(choices_div);

    if (choices.length > 0) {
        $.each(choices, function(index, choice) {
            add_feedback_choice(CHOICE_ID_PREFIX, CHOICE_NAME_PREFIX, CONTAINER_DIV_ID, CHOICES_DIV_ID, true, choice);
        });
    } else {
        add_feedback_choice(CHOICE_ID_PREFIX, CHOICE_NAME_PREFIX, CONTAINER_DIV_ID, CHOICES_DIV_ID, true);
        add_feedback_choice(CHOICE_ID_PREFIX, CHOICE_NAME_PREFIX, CONTAINER_DIV_ID, CHOICES_DIV_ID, true);
    }
}

function add_feedback_question_to_popup(question, id, type, readable_type, choices, checked) {
    var tr = $('<tr>');
    var td_question = $('<td class="question-cell">');
    var td_type = $('<td class="type-cell">' + readable_type + '</td>');
    var td_edit = $('<td class="edit-cell">');
    var inputs_div = $("#edit-feedback-question-inputs");
    var input_div = $('<div id="feedback-question-input-div-' + id + '">');
    var label = $('<label class="feedback-question-input-label" for="feedback-question-' + id + '">');
    var checkbox = $('<input type="checkbox" id="fb-question-checkbox-' + id + '" class="feedback-question-checkbox">');
    if (checked) {
        checkbox.prop("checked", true);
    }
    
    td_question.append(checkbox);
    td_question.append('<label id="feedback-question-' + id + '-label" for="fb-question-checkbox-' + id +
                       '" class="feedback-question-label">' + question + '</label>');
    td_edit.append('<button type="button" class="edit-button" onclick="show_feedback_question_edit_menu(\'' + id + '\');"></button>');
    tr.append(td_question);
    tr.append(td_type);
    tr.append(td_edit);
    $("#add-feedback-table > tbody").append(tr);

    label.append('<span class="feedback-question-span">Feedback question:</span>');
    label.append('<input type="text" id="feedback-question-' + id + '" class="feedback-question-input" name="question_field_[' +
                 id + ']" maxlength="100" value="' + question + '">');
    input_div.append(label);
    input_div.append($('<div id="feedback-question-' + id + '-error" class="admin-error">'));
    input_div.append('<input type="text" id="feedback-type-' + id + '" name="type_field_[' + id + ']" value="' + type + '" hidden readonly>');
    inputs_div.append(input_div);
    if (type === "MULTIPLE_CHOICE_FEEDBACK") {
        add_feedback_choices_to_popup(id, choices);
    }
}

function create_new_feedback_question_entry() {
    var question = $("#feedback-question-new").val();
    var type = $("#feedback-type-select").val();
    var readable_type = type.toLowerCase().replace(/_/g, " ");
    var choices = [];
    var choices_div = $("#new-feedback-choices");
    var choice_container_div = $("#new-feedback-choice-container");
    
    $("#create-feedback-div input[type=text].feedback-choice").each(function() {
        choices.push(this.value); 
    });

    var new_count = 0;
    var already_exists = false;
    $("#add-feedback-div label.feedback-question-label").each(function() {
        if ($(this).text() === question) {
            already_exists = true;
            return false;
        }
        if (this.id.indexOf("new") > -1) {
            new_count++;
        }
    });
    if (already_exists) {
        var feedback_error_div = $("#new-feedback-question-error");
        feedback_error_div.text("This feedback question already exists");
        feedback_error_div.css({"display" : "block"});
        return;
    }

    //TODO: Check duplicate choices here, too.

    $("div.popup div.admin-error").hide();
    $("#feedback-question-new").val("");
    choices_div.empty();
    remove_scrolling_from_choices(choices_div, choice_container_div);
    handle_feedback_type_selection($("#feedback-type-select")[0]);
    add_feedback_question_to_popup(question, "new-" + (new_count + 1), type, readable_type, choices, true);
}

function update_create_feedback_button_state() {
    var button = $("#create-feedback-button");
    var question_val = $("#feedback-question-new").val();
    var choice1 = $("#new-feedback-choice-1");
    var choice2 = $("#new-feedback-choice-2");
    if (question_val === "" ||
        (choice1.length > 0 && choice1.val() === "") ||
        (choice2.length > 0 && choice2.val() === "")) {
        button.prop("disabled", true);
    } else {
        button.prop("disabled", false);
    }
}

function show_edit_feedback_questions_popup(event, url) {
    event.preventDefault();

    $.get(url, function(data, textStatus, jqXHR) {
        var questions = [];
        $('#feedback-question-table tbody tr').each(function() {
            questions.push($(this).find("td:first").html());   
        });
        var popup = $("#edit-feedback-popup");
        var error_span = $("#edit-feedback-popup-error");
        var result = data.result;
        var error = data.error;

        if (error) {
            error_span.text(error);
            error_span.css({"display" : "inline-block"});
            return;
        } else {
            error_span.empty();
            error_span.hide();
        }   

        $("div.popup div.admin-error").hide();
        $("#add-feedback-table > tbody").empty();
        $("#fb-question-checkbox-all").prop("checked", false);
        $("#feedback-choice-container").empty();
        $("#edit-feedback-question-inputs").empty();
        $("#edit-feedback-div").hide();
        $("#create-feedback-div").css({"display" : "block"});
        
        $.each(result, function() {
            var question = this.question;
            if ($.inArray(question, questions) > -1) {
                add_feedback_question_to_popup(question, this.id, this.type, this.readable_type, this.choices, true);
            } else {
                add_feedback_question_to_popup(question, this.id, this.type, this.readable_type, this.choices, false);
            }
        });
        $('#new-feedback-choices').empty();
        handle_feedback_type_selection($("#feedback-type-select")[0]);
        popup.css({"opacity": "1", "pointer-events": "auto"});
    });
}

function delete_feedback_from_table(button) {
    $(button).parent().parent().remove();
}

function show_stagecmd_information(event) {
    var clicked_id = event.target.id;
    var split_id = clicked_id.split("-");
    var clicked_type = split_id[0];
    var clicked_number = split_id[1];
    $('div.selection-information').hide();
    $('#' + clicked_type + '-information-' + clicked_number).show() 
}

function submit_main_form(e) {
    e.preventDefault();
    console.log("User requested main form submit.");
    
    var form = $('#main-form');

    // Get the hierarchy of stages and commands for the calculation of implicit
    // ordinal_numbers at the form validation
    var tests = [];
    $('#test-tabs > ol > li').each(function(x) {
        var current_href = $(this).children('a').attr('href');
        if (current_href !== undefined) {
            var current_id = current_href.split('-')[2];
            tests.push(current_id);
        }
    });
    var order_hierarchy = {stages_of_tests: {}, commands_of_stages: {}};
    for (let test_id of tests) {
        var stage_order;
        
        $('#stages-sortable-' + test_id).each(function(x) {
            stage_order = $(this).sortable("toArray", options={attribute: 'data-stage-id'});
            order_hierarchy.stages_of_tests[test_id] = stage_order;
            
            for (let stage_id of stage_order) {
                var command_order;
                $('#commands-sortable-' + test_id + '-' + stage_id).each(function(y) {
                    command_order = $(this).sortable("toArray", options={attribute: 'data-command-id'});
                });
                order_hierarchy.commands_of_stages[stage_id] = command_order;
            }
        });
    }
    console.log(order_hierarchy);

    // Get the linked feedback questions
    var question_ids = $('#feedback-question-table > table > tbody > tr').map(function() {
        return this.getAttribute('data-question-id');
    }).get().join(',');
    console.log("Question ids: ");
    console.log(question_ids);
    
    var form_type = form.attr('method');
    var form_url = form.attr('action');

    console.log("Method: " + form_type + ", URL: " + form_url);

    var form_data = new FormData(form[0]);
    form_data.append('order_hierarchy', JSON.stringify(order_hierarchy));
    form_data.append('exercise_feedback_questions', question_ids);

    console.log("Serialized form data:");
    for (var [key, value] of form_data.entries()) {
        console.log(key, value);
    }

    console.log("Submitting the form...");
    $.ajax({
        type: form_type,
        url: form_url,
        data: form_data,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function(data, text_status, jqxhr_obj) {},
        error: function(xhr, status, type) {}
    });
}

var test_enum = 1;

function add_test() {
    var new_id = 'newt' + test_enum;
    var new_name = "New test";
    var new_stage_id = 'news' + stage_enum;
    var new_cmd_id = 'newc' + cmd_enum;

    var test_tablist = $("#test-tabs > ol:first-child");
    // TODO: The new test tab item should be included in the template section and cloned.
    var new_test_tab_item = $('<li><a href="#test-tabs-' + new_id + '" id="test-' + new_id + '">' + new_name + '</a></li>');
    new_test_tab_item.insertBefore("li.test-tab-button-container");

    // Create the new test tab
    var new_test_tab = $("#test-tabs-SAMPLE_TEST_ID").clone().attr('id', 'test-tabs-' + new_id);
    new_test_tab.html(function(index, html) {
        return html.replace(/SAMPLE_TEST_ID/g, new_id).replace(/SAMPLE_STAGE_ID/g, new_stage_id).
            replace(/SAMPLE_COMMAND_ID/g, new_cmd_id).replace(/SAMPLE_STAGE_ORDINAL_NUMBER/g, '1').
            replace(/SAMPLE_COMMAND_ORDINAL_NUMBER/g, '1');
    });
    $("#test-tabs").append(new_test_tab);

    $("#test-tabs").tabs('refresh');
    $("#stages-sortable-" + new_id).sortable();
    $("#stages-sortable-" + new_id).disableSelection();
    $("#commands-sortable-" + new_id + "-" + new_stage_id).sortable();
    $("#commands-sortable-" + new_id + "-" + new_stage_id).disableSelection();
    
    test_enum++;
    stage_enum++;
    cmd_enum++;
}

var stage_enum = 1;

function add_stage(test_id) {
    var new_id = 'news' + stage_enum;
    var stage_list = $("#stages-sortable-" + test_id);
    var stage_ordnum = stage_list.children().length + 1;
    var cmd_ordnum = 1;
    
    // Create the new stage and a command to the list
    //<li class="ui-state-default" data-stage-id="SAMPLE_STAGE_ID">
    var new_cmd_id = 'newc' + cmd_enum;
    var new_stage_list_item = $('li[data-stage-id="SAMPLE_STAGE_ID"]').clone().attr('data-stage-id', new_id);
    new_stage_list_item.html(function(index, html) {
        return html.replace(/SAMPLE_TEST_ID/g, test_id).replace(/SAMPLE_STAGE_ID/g, new_id).
            replace(/SAMPLE_COMMAND_ID/g, new_cmd_id);
    });
    stage_list.append(new_stage_list_item);

    var new_cmd_list = $("#commands-sortable-" + test_id + "-" + new_id);

    // Create the information box to the right side of the list for the new command
    var new_cmd_info = $('#command-information-SAMPLE_COMMAND_ID').clone().attr('id', 'command-information-' + new_cmd_id);
    new_cmd_info.html(function(index, html) {
        return html.replace(/SAMPLE_COMMAND_ID/g, new_cmd_id).replace(/SAMPLE_STAGE_ORDINAL_NUMBER/g, stage_ordnum).
            replace(/SAMPLE_COMMAND_ORDINAL_NUMBER/g, cmd_ordnum);
    });
    $("#selection-information-container-" + test_id).append(new_cmd_info);

    // Create the information box to the right side of the list for the new stage
    var new_stage_info = $('#stage-information-SAMPLE_STAGE_ID').clone().attr('id', 'stage-information-' + new_id);
    new_stage_info.html(function(index, html) {
        return html.replace(/SAMPLE_STAGE_ID/g, new_id).replace(/SAMPLE_STAGE_ORDINAL_NUMBER/g, stage_ordnum);
    });
    $("#selection-information-container-" + test_id).append(new_stage_info);

    new_cmd_list.sortable();
    new_cmd_list.disableSelection();
    cmd_enum++;

    stage_list.sortable("refresh");
    stage_enum++;
}

var cmd_enum = 1;

function add_command(test_id, stage_id) {
    var new_id = 'newc' + cmd_enum;
    var cmd_list = $("#commands-sortable-" + test_id + "-" + stage_id);
    var cmd_ordnum = cmd_list.children().length + 1;
    var stage_list = $("#stages-sortable-" + test_id);
    var stage_ordnum = stage_list.children("li[data-stage-id=" + stage_id + "]").index() + 1;
    
    // Create the new command to the list
    var new_cmd_list_item = $('li[data-command-id="SAMPLE_COMMAND_ID"]').clone().attr('data-command-id', new_id);
    new_cmd_list_item.html(function(index, html) {
        return html.replace(/SAMPLE_COMMAND_ID/g, new_id);
    });
    cmd_list.append(new_cmd_list_item);

    // Create the information box to the right side of the list
    var new_cmd_info = $('#command-information-SAMPLE_COMMAND_ID').clone().attr('id', 'command-information-' + new_id);
    new_cmd_info.html(function(index, html) {
        return html.replace(/SAMPLE_COMMAND_ID/g, new_id).replace(/SAMPLE_STAGE_ORDINAL_NUMBER/g, stage_ordnum).
            replace(/SAMPLE_COMMAND_ORDINAL_NUMBER/g, cmd_ordnum);
    });
    $("#selection-information-container-" + test_id).append(new_cmd_info);

    stage_list.sortable("refresh");
    cmd_list.sortable("refresh");
    cmd_enum++;
}

function edit_feedback_form_success(data, text_status, jqxhr_obj) {
    var ID_PATTERN = /\[(.*?)\]/;
    var CHOICE_N_PATTERN = /\{(.*?)\}/;
    if (data.error) {
        var sep = "<br>";
        $.each(data.error, function(err_source, err_msg) {
            if (err_source === "__all__") {
                var error_div = $("#feedback-error");
            } else {
                var question_id = err_source.match(ID_PATTERN)[1];
                if (err_source.startsWith("question_field")) {
                    var error_div = $("#feedback-question-" + question_id + "-error");
                } else if (err_source.startsWith("type_field")) {
                    var error_div = $("#feedback-error");
                } else if (err_source.startsWith("choice_field")) {
                    var choice_n = err_source.match(CHOICE_N_PATTERN)[1];
                    var error_div = $("#feedback-choice-" + question_id + "-" + choice_n + "-error");
                }
            }
            error_div.html(err_msg.join(sep));
            error_div.css("display", "block");
            show_feedback_question_edit_menu(question_id);
            //TODO: Scroll to the choice that caused the error
        });
    } else if (data.result) {
        console.log("Feedback questions edited successfully!");
        close_popup_and_add_questions();
    }
}

function edit_feedback_form_error(xhr, status, type) {
    var error_span = $("#feedback-error");
    var error_str = "An error occured while sending the form:";
    status = status.charAt(0).toUpperCase() + status.slice(1);
    if (type) {
        error_str += status + ": " + type;
    } else {
        error_str += status;
    }
    error_span.html(error_str);
    error_span.css("display", "block");
}

function submit_edit_feedback_form(e) {
    e.preventDefault();
    console.log("User requested create feedback form submit.");

    $("div.popup div.admin-error").hide();

    var form = $('#edit-feedback-form');
    var form_type = form.attr('method');
    var form_url = form.attr('action');

    console.log("Method: " + form_type + ", URL: " + form_url);

    var form_data = new FormData(form[0]);

    console.log("Serialized form data:");
    for (var [key, value] of form_data.entries()) { 
        console.log(key, value);
    }
    
    console.log("Submitting the form...");
    $.ajax({
        type: form_type,
        url: form_url,
        data: form_data,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: edit_feedback_form_success,
        error: edit_feedback_form_error
    });
}
