const { useQuasar } = Quasar
const { ref } = Vue

const app = Vue.createApp({
    setup() {
        return {
            options: ref(false),
            help: ref(false),
            showBlur: ref(true),
        }
    },
    methods: {
        select: function (event) {
            targetId = event.currentTarget.id;
            showBlur()
        }
    }
})

app.use(Quasar, { config: {} })
app.mount('#inventory-menus')

function showBlur() {
    $.post('https://rsg-inventory/showBlur');
}

var InventoryOption = "0, 0, 0";

var totalWeight = 0;
var totalWeightOther = 0;

var playerMaxWeight = 0;
var otherMaxWeight = 0;

var otherLabel = "";

var ClickedItemData = {};

var SelectedAttachment = null;
var AttachmentScreenActive = false;
var ControlPressed = false;
var disableRightMouse = false;
var selectedItem = null;

var IsDragging = false;

$("#item-amount").val(0);

function hideDropInventory() {
    $(".oth-inv-container").hide();
    $(".other-inv-info").hide();
}

function showDropInventory() {
    $(".oth-inv-container").show();
    $(".other-inv-info").show();
}

document.getElementById("item-amount").addEventListener("focus", function() {
    // Verifica se o valor é '0' e apaga quando o campo for focado
    if (this.value === "0") {
        this.value = "";
    }
});

document.getElementById("item-amount").addEventListener("blur", function() {
    // Se o campo estiver vazio ao perder o foco, adiciona o valor '0' novamente
    if (this.value === "") {
        this.value = "0";
    }
});

$(document).on("keydown", function () {
    if (event.repeat) {
        return;
    }
    switch (event.keyCode) {
        case 27: // ESC
            Inventory.Close();
            break;
        case 9: // TAB
            Inventory.Close();
            break;
        case 17: // TAB
            ControlPressed = true;
            break;
    }
});

$(document).on("dblclick", ".item-slot", function (e) {
    var ItemData = $(this).data("item");
    var ItemInventory = $(this).parent().attr("data-inventory");
    if (ItemData) {
        Inventory.Close();
        $.post(
            "https://rsg-inventory/UseItem",
            JSON.stringify({
                inventory: ItemInventory,
                item: ItemData,
            })
        );
    }
});

$(document).on("keyup", function () {
    switch (event.keyCode) {
        case 17: // TAB
            ControlPressed = false;
            break;
    }
});

$(document).on("mouseenter", ".item-slot", function (e) {
    e.preventDefault();

    $(".ply-iteminfo-container").css("opacity", "0.0");
    if ($(this).data("item") !== null) {
        $(".ply-iteminfo-container").css("opacity", "1.0");
        $(".ply-iteminfo-container").fadeIn(150);
        FormatItemInfo($(this).data("item"), $(this));
    } else {
        $(".ply-iteminfo-container").fadeOut(100);
    }

    if ($(this).data("item") === undefined) {
        $(".ply-iteminfo-container").css("opacity", "0.0");
    }
});

$(document).on("mouseleave", ".item-slot", function (e) {
    $(".ply-iteminfo-container").css("opacity", "0.0");
});

// Autostack Quickmove
function GetFirstFreeSlot($toInv, $fromSlot) {
    var retval = null;
    $.each($toInv.find(".item-slot"), function (i, slot) {
        if ($(slot).data("item") === undefined) {
            if (retval === null) {
                retval = i + 1;
            }
        }
    });
    return retval;
}

function CanQuickMove() {
    var otherinventory = otherLabel.toLowerCase();
    var retval = true;
    if (otherinventory.split("-")[0] == "player") {
        retval = false;
    }
    return retval;
}

$(document).on("click", ".item-slot", function (e) {
    e.preventDefault();
    var ItemData = $(this).data("item");

    if (ItemData !== null && ItemData !== undefined) {
        if (ItemData.name !== undefined) {
            if (ItemData.name.split("_")[0] == "weapon") {
                if (!$("#weapon-attachments").length) {
                    // if (ItemData.info.attachments !== null && ItemData.info.attachments !== undefined && ItemData.info.attachments.length > 0) {
                    $(".inv-options-list").append(
                        '<div class="inv-option-item" id="weapon-attachments"><p><i style="margin-top: 1rem" class="fas fa-gun"></i></p></div>'
                    );
                    $("#weapon-attachments").hide().fadeIn(250);
                    ClickedItemData = ItemData;
                    // }
                } else if (ClickedItemData == ItemData) {
                    $("#weapon-attachments").fadeOut(250, function () {
                        $("#weapon-attachments").remove();
                    });
                    ClickedItemData = {};
                } else {
                    ClickedItemData = ItemData;
                }
            } else {
                ClickedItemData = {};
                if ($("#weapon-attachments").length) {
                    $("#weapon-attachments").fadeOut(250, function () {
                        $("#weapon-attachments").remove();
                    });
                }
            }
        } else {
            ClickedItemData = {};
            if ($("#weapon-attachments").length) {
                $("#weapon-attachments").fadeOut(250, function () {
                    $("#weapon-attachments").remove();
                });
            }
        }
    } else {
        ClickedItemData = {};
        if ($("#weapon-attachments").length) {
            $("#weapon-attachments").fadeOut(250, function () {
                $("#weapon-attachments").remove();
            });
        }
    }
});

$(document).on("click", "#inv-close", function (e) {
    e.preventDefault();
    Inventory.Close();
});

$(document).on("click", ".weapon-attachments-back", function (e) {
    e.preventDefault();
    $("#qbcore-inventory").css({ display: "block" });
    $("#qbcore-inventory").animate({
        left: 0 + "vw",
    },
        200
    );
    $(".weapon-attachments-container").animate({
        left: -100 + "vw",
    },
        200,
        function () {
            $(".weapon-attachments-container").css({ display: "none" });
        }
    );
    AttachmentScreenActive = false;
});

function FormatAttachmentInfo(data) {
    $.post(
        "https://rsg-inventory/GetWeaponData",
        JSON.stringify({
            weapon: data.name,
            ItemData: ClickedItemData,
        }),
        function (data) {
            var AmmoLabel = "9mm";
            var Durability = 100;
            if (data.WeaponData.ammotype == "AMMO_RIFLE") {
                AmmoLabel = "7.62";
            } else if (data.WeaponData.ammotype == "AMMO_SHOTGUN") {
                AmmoLabel = "12 Gauge";
            }
            if (ClickedItemData.info.quality !== undefined) {
                Durability = ClickedItemData.info.quality;
            }

            $(".weapon-attachments-container-title").html(
                data.WeaponData.label + " | " + AmmoLabel
            );
            $(".weapon-attachments-container-description").html(
                data.WeaponData.description
            );
            $(".weapon-attachments-container-details").html(
                '<span style="font-weight: bold; letter-spacing: .1vh;">Serial</span><br> ' +
                ClickedItemData.info.serie +
                '<br><br><span style="font-weight: bold; letter-spacing: .1vh;">Durability - ' +
                Durability.toFixed() +
                '% </span> <div class="weapon-attachments-container-detail-durability"><div class="weapon-attachments-container-detail-durability-total"></div></div>'
            );
            $(".weapon-attachments-container-detail-durability-total").css({
                width: Durability + "%",
            });
            $(".weapon-attachments-container-image").attr(
                "src",
                "./attachment_images/" + data.WeaponData.name + ".png"
            );
            $(".weapon-attachments").html("");

            if (data.AttachmentData !== null && data.AttachmentData !== undefined) {
                if (data.AttachmentData.length > 0) {
                    $(".weapon-attachments-title").html(
                        '<span style="font-weight: bold; letter-spacing: .1vh;">Attachments</span>'
                    );
                    $.each(data.AttachmentData, function (i, attachment) {
                        var WeaponType = data.WeaponData.ammotype
                            .split("_")[1]
                            .toLowerCase();
                        $(".weapon-attachments").append(
                            '<div class="weapon-attachment" id="weapon-attachment-' +
                            i +
                            '"> <div class="weapon-attachment-label"><p>' +
                            attachment.label +
                            '</p></div> <div class="weapon-attachment-img"><img src="http://127.0.0.1/items/' +
                            attachment.image + '"></div> </div>'
                        );
                        attachment.id = i;
                        $("#weapon-attachment-" + i).data("AttachmentData", attachment);
                    });
                } else {
                    $(".weapon-attachments-title").html(
                        '<span style="font-weight: bold; letter-spacing: .1vh;">This gun doesn\'t contain attachments</span>'
                    );
                }
            } else {
                $(".weapon-attachments-title").html(
                    '<span style="font-weight: bold; letter-spacing: .1vh;">This gun doesn\'t contain attachments</span>'
                );
            }

            handleAttachmentDrag();
        }
    );
}

var AttachmentDraggingData = {};

function handleAttachmentDrag() {
    $(".weapon-attachment").draggable({
        helper: "clone",
        appendTo: "body",
        scroll: true,
        revertDuration: 0,
        revert: "invalid",
        start: function (event, ui) {
            var ItemData = $(this).data("AttachmentData");
            $(this).addClass("weapon-dragging-class");
            AttachmentDraggingData = ItemData;
        },
        stop: function () {
            $(this).removeClass("weapon-dragging-class");
        },
    });
    $(".weapon-attachments-remove").droppable({
        accept: ".weapon-attachment",
        hoverClass: "weapon-attachments-remove-hover",
        drop: function (event, ui) {
            $.post(
                "https://rsg-inventory/RemoveAttachment",
                JSON.stringify({
                    AttachmentData: AttachmentDraggingData,
                    WeaponData: ClickedItemData,
                }),
                function (data) {
                    if (data.Attachments !== null && data.Attachments !== undefined) {
                        if (data.Attachments.length > 0) {
                            $("#weapon-attachment-" + AttachmentDraggingData.id).fadeOut(
                                150,
                                function () {
                                    $("#weapon-attachment-" + AttachmentDraggingData.id).remove();
                                    AttachmentDraggingData = null;
                                }
                            );
                        } else {
                            $("#weapon-attachment-" + AttachmentDraggingData.id).fadeOut(
                                150,
                                function () {
                                    $("#weapon-attachment-" + AttachmentDraggingData.id).remove();
                                    AttachmentDraggingData = null;
                                    $(".weapon-attachments").html("");
                                }
                            );
                            $(".weapon-attachments-title").html(
                                '<span style="font-weight: bold; letter-spacing: .1vh;">This gun doesn\'t contain attachments</span>'
                            );
                        }
                    } else {
                        $("#weapon-attachment-" + AttachmentDraggingData.id).fadeOut(
                            150,
                            function () {
                                $("#weapon-attachment-" + AttachmentDraggingData.id).remove();
                                AttachmentDraggingData = null;
                                $(".weapon-attachments").html("");
                            }
                        );
                        $(".weapon-attachments-title").html(
                            '<span style="font-weight: bold; letter-spacing: .1vh;">This gun doesn\'t contain attachments</span>'
                        );
                    }
                }
            );
        },
    });
}

$(document).on("click", "#weapon-attachments", function (e) {
    e.preventDefault();
    if (!Inventory.IsWeaponBlocked(ClickedItemData.name)) {
        $(".weapon-attachments-container").css({ display: "block" });
        $("#qbcore-inventory").animate({
            left: 100 + "vw",
        },
            200,
            function () {
                $("#qbcore-inventory").css({ display: "none" });
            }
        );
        $(".weapon-attachments-container").animate({
            left: 0 + "vw",
        },
            200
        );
        AttachmentScreenActive = true;
        FormatAttachmentInfo(ClickedItemData);
    } else {
        $.post(
            "https://rsg-inventory/Notify",
            JSON.stringify({
                message: "Attachments are unavailable for this gun.",
                type: "error",
            })
        );
    }
});

function formatAmount(data) {
    if (data.name === 'cash') {
        return (data.amount / 100).toFixed(2);
    } else {
        return data.amount;
    }
}

function FormatItemInfo(itemData, dom) {
    let element = $('.ply-iteminfo-container');
    element.css('text-align', 'center');

    if (itemData != null) {
        let amount = itemData.amount;
        if (itemData.name === 'cash') {
            amount = formatAmount(itemData);
        }

        let additionalInfo = "";
        let ItemSerie = itemData.info.serie || 'Sem serial';
        if (itemData.name.startsWith('weapon_revolver') ||
            itemData.name.startsWith('weapon_pistol') || 
            itemData.name.startsWith('weapon_rifle') ||
             itemData.name.startsWith('weapon_repeater') ||
             itemData.name.startsWith('weapon_sniperrifle') ||
             itemData.name.startsWith('weapon_shotgun')
            ) {
            additionalInfo = "<p id='id-weapon-serie' style='font-size:16px;color:#a5a5a5;'>Número de Série: " + ItemSerie + "</p>";
        }

        let pesoEmKg = (amount * itemData.weight) / 1000;
        let quality = itemData.info.quality || 100;

        $(".item-info-title").html("<p>" + itemData.label + "</p>");
        $(".item-info-description").html(
            additionalInfo + 
            "<p style='font-size:16px;'>" + itemData.description + "</p>" +
            "<p style='font-size:16px;'><b>Peso: </b>" + pesoEmKg.toFixed(2) + " KG | <b>Quantidade: </b> " + amount + " | <b>Qualidade: </b> " + 
            "<a style='font-size:16px;color:green;'>" + Math.floor(quality) + "</a></p>"
        );
    }
}



function reloadInventory() {
    setTimeout(function () {
        $.post("https://rsg-inventory/ReloadInventory", JSON.stringify({}));
    }, 10)
    //console.log("ATT!")
}

let isDragCooldown = false;

function handleDragDrop() {
    $(".item-drag").draggable({
        helper: "clone",
        appendTo: "body",
        scroll: true,
        revertDuration: 0,
        revert: "invalid",
        cancel: ".item-nodrag",
        start: function (event, ui) {
            //console.log("Start Item Drag")
            if (isDragCooldown) return false;

            var itemData = $(this).data("item");
            $(this).data("currentItemData", itemData);

            var dragAmount = $("#item-amount").val();
            // console.log(dragAmount);

            if ((dragAmount % 1 !== 0 && itemData.name !== 'cash')) {
                return false;
            }

            if (itemData.name === 'cash') {
                dragAmount = dragAmount * 100
            } else {
                dragAmount = dragAmount * 1
            }

            IsDragging = true;
            $(this).find("img").css("filter", "brightness(50%)");

            if (dragAmount == 0) {
                dragAmount = itemData.amount;
            }

            if (dragAmount > itemData.amount) {
                dragAmount = itemData.amount;
            }


            if (itemData.name === 'cash') {

                var valorAjustado = (dragAmount / 100).toFixed(2);

                $(".ui-draggable-dragging").find(".item-slot-amount p").html(valorAjustado);

                if (itemData.price != null) {
                    $(".ui-draggable-dragging").find(".item-slot-amount p").html(valorAjustado + " $" + itemData.price);
                } else {
                    $(".ui-draggable-dragging").find(".item-slot-amount p").html(valorAjustado);
                }

                $(".ui-draggable-dragging").find(".item-slot-key").remove();
            } else {

                $(".ui-draggable-dragging").find(".item-slot-amount p").html(dragAmount);

                if (itemData.price != null) {
                    $(".ui-draggable-dragging").find(".item-slot-amount p").html(dragAmount + " $" + itemData.price);
                } else {
                    $(".ui-draggable-dragging").find(".item-slot-amount p").html(dragAmount);
                }

                $(".ui-draggable-dragging").find(".item-slot-key").remove();
            }

            ajustFont();

        },
        stop: function () {
            //console.log("Stop Item Drag")
            var element = $(this);
            var itemData = element.data("currentItemData");
            
            // setTimeout(function () {
            //     IsDragging = false;
            //     if (itemData.context !== undefined || itemData.trigger !== undefined) {
            //         reloadInventory();
            //     }
            // }, 300);

            element.css("background", "rgba(0, 0, 0, 0.3)");
            element.find("img").css("filter", "brightness(100%)");

            isDragCooldown = true;
            setTimeout(() => {
                isDragCooldown = false;
            }, 500);

            ajustFont();
        },
    });

    $(".item-slot").droppable({
        hoverClass: "item-slot-hoverClass",
        drop: function (event, ui) {
            //console.log("Drop Item Slot");
            if (isDragCooldown) return;

            var fromSlot = ui.draggable.attr("data-slot");
            var fromInventory = ui.draggable.parent();
            var toSlot = $(this).attr("data-slot");
            var toInventory = $(this).parent();
            var toAmount = $("#item-amount").val();

            var fromData = fromInventory.find("[data-slot=" + fromSlot + "]").data("item");
            var toData = toInventory.find("[data-slot=" + toSlot + "]").data("item");

            // Verifique se o item é 'cash' e ajuste a quantidade
            if (fromData.name === 'cash') {
                toAmount = toAmount * 100;
            } else {
                toAmount = toAmount * 1;
            }

            if (fromSlot == toSlot && fromInventory == toInventory) {
                return;
            }

            if (toAmount >= 0) {
                if (!toData) {
                    if (updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)) {
                        swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                    }
                } else {
                    if (fromData.unique == toData.unique) {
                        if (!toData.combinable) {
                            if (updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)) {
                                swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                            }
                        } else {
                            swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                        }
                    } else {
                        if (updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)) {
                            swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                        }
                    }
                }
            }
            ajustFont();
        }

    });


    $("#item-use").droppable({
        hoverClass: "button-hover",
        drop: function (event, ui) {
            if (isDragCooldown) return;

            fromData = ui.draggable.data("item");
            fromInventory = ui.draggable.parent().attr("data-inventory");
            if (fromData.useable) {
                if (fromData.shouldClose) {
                    Inventory.Close();
                }
                $.post(
                    "https://rsg-inventory/UseItem",
                    JSON.stringify({
                        inventory: fromInventory,
                        item: fromData,
                    })
                );
            }
            ajustFont();
        },
    });

    $("#item-drop").droppable({
        hoverClass: "item-slot-hoverClass",
        drop: function (event, ui) {
            if (isDragCooldown) return;

            fromData = ui.draggable.data("item");
            fromInventory = ui.draggable.parent().attr("data-inventory");
            amount = $("#item-amount").val();
            if (amount == 0) {
                amount = fromData.amount;
            }
            $(this).css("background", "rgba(35,35,35, 0.7");
            $.post(
                "https://rsg-inventory/DropItem",
                JSON.stringify({
                    inventory: fromInventory,
                    item: fromData,
                    amount: amount,
                })
            );
            ajustFont();
        },
    });
}




function updateweights($fromSlot, $toSlot, $fromInv, $toInv, $toAmount) {
    // console.log("Peso 1")
    var otherinventory = otherLabel.toLowerCase();
    if (otherinventory.split("-")[0] == "dropped") {
        toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if (toData !== null && toData !== undefined) {
            // console.log("Peso 1")
            InventoryError($fromInv, $fromSlot);
            return false;
        }
    }

    if (
        ($fromInv.attr("data-inventory") == "hotbar" &&
            $toInv.attr("data-inventory") == "player") ||
        ($fromInv.attr("data-inventory") == "player" &&
            $toInv.attr("data-inventory") == "hotbar") ||
        ($fromInv.attr("data-inventory") == "player" &&
            $toInv.attr("data-inventory") == "player") ||
        ($fromInv.attr("data-inventory") == "hotbar" &&
            $toInv.attr("data-inventory") == "hotbar")
    ) {
        return true;
    }

    if (
        ($fromInv.attr("data-inventory").split("-")[0] == "itemshop" &&
            $toInv.attr("data-inventory").split("-")[0] == "itemshop") ||
        ($fromInv.attr("data-inventory") == "crafting" &&
            $toInv.attr("data-inventory") == "crafting")
    ) {
        itemData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name"><p>' +
                    " $" +
                    itemData.price +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        } else {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name"><p>' +
                    " " +
                    ((itemData.weight * itemData.amount) / 1000).toFixed(3) +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if (
        $toAmount == 0 &&
        ($fromInv.attr("data-inventory").split("-")[0] == "itemshop" ||
            $fromInv.attr("data-inventory") == "crafting")
    ) {
        itemData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name"><p>' +
                    " $" +
                    itemData.price +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        } else {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name"><p>' +
                    " " +
                    ((itemData.weight * itemData.amount) / 1000).toFixed(3) +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if (
        // $toInv.attr("data-inventory").split("-")[0] == "itemshop" ||
        $toInv.attr("data-inventory") == "crafting"
    ) {
        itemData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if ($toInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $toInv
                .find("[data-slot=" + $toSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name"><p>' +
                    " $" +
                    itemData.price +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        } else {
            $toInv
                .find("[data-slot=" + $toSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name"><p>' +
                    " " +
                    ((itemData.weight * itemData.amount) / 1000).toFixed(3) +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if ($fromInv.attr("data-inventory") != $toInv.attr("data-inventory")) {
        fromData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if ($toAmount == 0) {
            $toAmount = fromData.amount;
        }
        if (toData == null || fromData.name == toData.name) {
            if (
                $fromInv.attr("data-inventory") == "player" ||
                $fromInv.attr("data-inventory") == "hotbar"
            ) {
                totalWeight = totalWeight - fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther + fromData.weight * $toAmount;
            } else {
                totalWeight = totalWeight + fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther - fromData.weight * $toAmount;
            }
        } else {
            if (
                $fromInv.attr("data-inventory") == "player" ||
                $fromInv.attr("data-inventory") == "hotbar"
            ) {
                totalWeight = totalWeight - fromData.weight * $toAmount;
                totalWeight = totalWeight + toData.weight * toData.amount;

                totalWeightOther = totalWeightOther + fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther - toData.weight * toData.amount;
            } else {
                totalWeight = totalWeight + fromData.weight * $toAmount;
                totalWeight = totalWeight - toData.weight * toData.amount;

                totalWeightOther = totalWeightOther - fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther + toData.weight * toData.amount;
            }
        }
    }

    if (
        totalWeight > playerMaxWeight ||
        (totalWeightOther > otherMaxWeight &&
            $fromInv.attr("data-inventory").split("-")[0] != "itemshop" &&
            $fromInv.attr("data-inventory") != "crafting")
    ) {
        InventoryError($fromInv, $fromSlot);
        return false;
    }

    var per = (totalWeight / 1000) / (playerMaxWeight / 100000)
    $(".pro").css("width", per + "%")
    $("#player-inv-weight").html(
        // '<i class="fas fa-dumbbell"></i> ' +
        (parseInt(totalWeight) / 1000).toFixed(2) +
        "/" +
        (playerMaxWeight / 1000).toFixed(2)
    );
    if (
        $fromInv.attr("data-inventory").split("-")[0] != "itemshop" &&
        $toInv.attr("data-inventory").split("-")[0] != "itemshop" &&
        $fromInv.attr("data-inventory") != "crafting" &&
        $toInv.attr("data-inventory") != "crafting"
    ) {
        $("#other-inv-label").html(otherLabel);
        $("#other-inv-weight").html(
            // '<i class="fas fa-dumbbell"></i> ' +
            (parseInt(totalWeightOther) / 1000).toFixed(3) +
            "/" +
            (otherMaxWeight / 1000).toFixed(3)
        );
        var per1 = (totalWeightOther / 1000) / (otherMaxWeight / 100000)
        $(".pro1").css("width", per1 + "%");
    }

    return true;
}

var combineslotData = null;

$(document).on("click", ".CombineItem", function (e) {
    e.preventDefault();
    if (combineslotData.toData.combinable.anim != null) {
        $.post(
            "https://rsg-inventory/combineWithAnim",
            JSON.stringify({
                combineData: combineslotData.toData.combinable,
                usedItem: combineslotData.toData.name,
                requiredItem: combineslotData.fromData.name,
            })
        );
    } else {
        $.post(
            "https://rsg-inventory/combineItem",
            JSON.stringify({
                reward: combineslotData.toData.combinable.reward,
                toItem: combineslotData.toData.name,
                fromItem: combineslotData.fromData.name,
            })
        );
    }
    Inventory.Close();
});

$(document).on("click", ".SwitchItem", function (e) {
    e.preventDefault();
    $(".combine-option-container").hide();

    optionSwitch(
        combineslotData.fromSlot,
        combineslotData.toSlot,
        combineslotData.fromInv,
        combineslotData.toInv,
        combineslotData.toAmount,
        combineslotData.toData,
        combineslotData.fromData
    );
});

function optionSwitch(
    $fromSlot,
    $toSlot,
    $fromInv,
    $toInv,
    $toAmount,
    toData,
    fromData
) {
    fromData.slot = parseInt($toSlot);

    $toInv.find("[data-slot=" + $toSlot + "]").data("item", fromData);

    $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
    $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

    if ($toSlot < 5) {
        $toInv
            .find("[data-slot=" + $toSlot + "]")
            .html(
                '<div class="item-slot-key"><p>' +
                $toSlot +
                '</p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                fromData.image +
                '" alt="' +
                fromData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                fromData.amount +
                '</div><div class="item-slot-name"><p>' +
                " " +
                ((fromData.weight * fromData.amount) / 1000).toFixed(3) +
                '</p></div><div class="item-slot-label"><p>' +
                fromData.label +
                "</p></div>"
            );
    } else {
        $toInv
            .find("[data-slot=" + $toSlot + "]")
            .html(
                '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                fromData.image +
                '" alt="' +
                fromData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                fromData.amount +
                '</div><div class="item-slot-name"><p>' +
                " " +
                ((fromData.weight * fromData.amount) / 1000).toFixed(3) +
                '</p></div><div class="item-slot-label"><p>' +
                fromData.label +
                "</p></div>"
            );
    }

    toData.slot = parseInt($fromSlot);

    $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
    $fromInv.find("[data-slot=" + $fromSlot + "]").removeClass("item-nodrag");

    $fromInv.find("[data-slot=" + $fromSlot + "]").data("item", toData);

    if ($fromSlot < 5) {
        $fromInv
            .find("[data-slot=" + $fromSlot + "]")
            .html(
                '<div class="item-slot-key"><p>' +
                $fromSlot +
                '</p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                toData.image +
                '" alt="' +
                toData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                toData.amount +
                '</div><div class="item-slot-name"><p>' +
                " " +
                ((toData.weight * toData.amount) / 1000).toFixed(3) +
                '</p></div><div class="item-slot-label"><p>' +
                toData.label +
                "</p></div>"
            );
    } else {
        $fromInv
            .find("[data-slot=" + $fromSlot + "]")
            .html(
                '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                toData.image +
                '" alt="' +
                toData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                toData.amount +
                '</div><div class="item-slot-name"><p>' +
                " " +
                ((toData.weight * toData.amount) / 1000).toFixed(3) +
                '</p></div><div class="item-slot-label"><p>' +
                toData.label +
                "</p></div>"
            );
    }

    $.post(
        "https://rsg-inventory/SetInventoryData",
        JSON.stringify({
            fromInventory: $fromInv.attr("data-inventory"),
            toInventory: $toInv.attr("data-inventory"),
            fromSlot: $fromSlot,
            toSlot: $toSlot,
            fromAmount: $toAmount,
            toAmount: toData.amount,
        })
    );
}

function swap($fromSlot, $toSlot, $fromInv, $toInv, $toAmount) {
    fromData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
    toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
    var otherinventory = otherLabel.toLowerCase();

    if (otherinventory.split("-")[0] == "dropped") {
        if (toData !== null && toData !== undefined) {
            InventoryError($fromInv, $fromSlot);
            return;
        }
    }

    if (fromData !== undefined && fromData.amount >= $toAmount) {
        if (fromData.unique && $toAmount > 1) {
            InventoryError($fromInv, $fromSlot);
            return;
        }

        if (
            ($fromInv.attr("data-inventory") == "player" ||
                $fromInv.attr("data-inventory") == "hotbar") &&
            $toInv.attr("data-inventory").split("-")[0] == "itemshop" &&
            $toInv.attr("data-inventory") == "crafting"
        ) {
            InventoryError($fromInv, $fromSlot);
            return;
        }

        if (
            $toAmount == 0 &&
            $fromInv.attr("data-inventory").split("-")[0] == "itemshop" &&
            $fromInv.attr("data-inventory") == "crafting"
        ) {
            InventoryError($fromInv, $fromSlot);
            return;
        } else if ($toAmount == 0) {
            $toAmount = fromData.amount;
        }
        if (
            (toData != undefined || toData != null) &&
            toData.name == fromData.name &&
            !fromData.unique
        ) {
            var newData = [];
            newData.name = toData.name;
            newData.label = toData.label;
            newData.amount = parseInt($toAmount) + parseInt(toData.amount);
            newData.type = toData.type;
            newData.description = toData.description;
            newData.image = toData.image;
            newData.weight = toData.weight;
            newData.info = toData.info;
            newData.useable = toData.useable;
            newData.unique = toData.unique;
            newData.slot = parseInt($toSlot);

            if (newData.name == fromData.name) {
                if (newData.info.quality !== fromData.info.quality) {
                    InventoryError($fromInv, $fromSlot);
                    $.post(
                        "https://qb-inventory/Notify",
                        JSON.stringify({
                            message: "You can not stack items which are not the same quality.",
                            type: "error",
                        })
                    );
                    return;

                }
            }

            if (fromData.amount == $toAmount) {
                //console.log("FROMDATA.AMOUNT == $TOAMOUNT" + fromData.amount);

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", newData);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + newData.label + "</p></div>";
                // if (newData.name.split("_")[0] == "weapon") {
                //     if (!Inventory.IsWeaponBlocked(newData.name)) {
                ItemLabel =
                    '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                    newData.label +
                    "</p></div>";
                // }
                // }

                if ($toSlot < 5 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            formatAmount(newData) +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(2) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else if ($toSlot == 43 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>5 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            formatAmount(newData) +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(2) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            formatAmount(newData) +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(2) +
                            "</p></div>" +
                            ItemLabel
                        );
                }

                // if (newData.name.split("_")[0] == "weapon") {
                // if (!Inventory.IsWeaponBlocked(newData.name)) {
                if (newData.info.quality == undefined) {
                    newData.info.quality = 100.0;
                }
                var QualityColor = "#9e382c"; 
                if (newData.info.quality < 25) {
                    QualityColor = "#bd6f46";
                } else if (newData.info.quality > 25 && newData.info.quality < 50) {
                    QualityColor = "#d7ed68";
                } else if (newData.info.quality >= 50) {
                    QualityColor = "#68edad";
                }
                if (newData.info.quality !== undefined) {
                    qualityLabel = newData.info.quality.toFixed();
                } else {
                    qualityLabel = newData.info.quality;
                }
                if (newData.info.quality == 0) {
                    //qualityLabel = "BROKEN";
                }
                $toInv
                    .find("[data-slot=" + $toSlot + "]")
                    .find(".item-slot-quality-bar")
                    .css({
                        "border-color": QualityColor,  /* Define a cor da borda para o progresso */
                        "clip-path": `inset(0 round ${qualityLabel}%)`  /* Ajusta a borda interna com base na qualidade */
                    })
                    .find("p")
                    .html(qualityLabel);
                // }
                // }

                $fromInv.find("[data-slot=" + $fromSlot + "]").removeClass("item-drag");
                $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-nodrag");

                $fromInv.find("[data-slot=" + $fromSlot + "]").removeData("item");
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .html(
                        '<div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                    );
            } else if (fromData.amount > $toAmount) {
                //console.log("FROMDATA.AMOUNT > $TOAMOUNT" + fromData.amount);
                var newDataFrom = [];
                newDataFrom.name = fromData.name;
                newDataFrom.label = fromData.label;
                newDataFrom.amount = parseInt(fromData.amount - $toAmount);
                newDataFrom.type = fromData.type;
                newDataFrom.description = fromData.description;
                newDataFrom.image = fromData.image;
                newDataFrom.weight = fromData.weight;
                newDataFrom.price = fromData.price;
                newDataFrom.info = fromData.info;
                newDataFrom.useable = fromData.useable;
                newDataFrom.unique = fromData.unique;
                newDataFrom.slot = parseInt($fromSlot);

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", newData);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + newData.label + "</p></div>";
                // if (newData.name.split("_")[0] == "weapon") {
                // if (!Inventory.IsWeaponBlocked(newData.name)) {
                ItemLabel =
                    '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                    newData.label +
                    "</p></div>";
                // }
                // }

                if ($toSlot < 5 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            formatAmount(newData) +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(3) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else if ($toSlot == 43 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>5 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            formatAmount(newData) +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(3) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            formatAmount(newData) +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(3) +
                            "</p></div>" +
                            ItemLabel
                        );
                }

                // if (newData.name.split("_")[0] == "weapon") {
                // if (!Inventory.IsWeaponBlocked(newData.name)) {
                if (newData.info.quality == undefined) {
                    newData.info.quality = 100.0;
                }
                var QualityColor = "#79181d";
                if (newData.info.quality < 25) {
                    QualityColor = "#79181d";
                } else if (newData.info.quality > 25 && newData.info.quality < 50) {
                    QualityColor = "#79181d";
                } else if (newData.info.quality >= 50) {
                    QualityColor = "#79181d";
                }
                if (newData.info.quality !== undefined) {
                    qualityLabel = newData.info.quality.toFixed();
                } else {
                    qualityLabel = newData.info.quality;
                }
                if (newData.info.quality == 0) {
                    //qualityLabel = "BROKEN";
                }
                $toInv
                    .find("[data-slot=" + $toSlot + "]")
                    .find(".item-slot-quality-bar")
                    .css({
                        "border-color": QualityColor,  /* Define a cor da borda para o progresso */
                        "clip-path": `inset(0 round ${qualityLabel}%)`  /* Ajusta a borda interna com base na qualidade */
                    })
                    .find("p")
                    .html(qualityLabel);
                // }
                // }

                // From Data zooi
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .data("item", newDataFrom);

                $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .removeClass("item-nodrag");

                if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                            newDataFrom.image +
                            '" alt="' +
                            newDataFrom.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            formatAmount(newDataFrom) +
                            '</div><div class="item-slot-name"><p>' +
                            " $" +
                            newDataFrom.price +
                            '</p></div><div class="item-slot-label"><p>' +
                            newDataFrom.label +
                            "</p></div>"
                        );
                } else {
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' +
                        newDataFrom.label +
                        "</p></div>";
                    // if (newDataFrom.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                    ItemLabel =
                        '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                        newDataFrom.label +
                        "</p></div>";
                    // }
                    // }

                    if ($fromSlot < 5 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(newDataFrom) +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else if (
                        $fromSlot == 43 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>5 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(newDataFrom) +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(newDataFrom) +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }

                    // if (newDataFrom.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                    if (newDataFrom.info.quality == undefined) {
                        newDataFrom.info.quality = 100.0;
                    }
                    var QualityColor = "#79181d";
                    if (newDataFrom.info.quality < 25) {
                        QualityColor = "#79181d";
                    } else if (
                        newDataFrom.info.quality > 25 &&
                        newDataFrom.info.quality < 50
                    ) {
                        QualityColor = "#79181d";
                    } else if (newDataFrom.info.quality >= 50) {
                        QualityColor = "#79181d";
                    }
                    if (newDataFrom.info.quality !== undefined) {
                        qualityLabel = newDataFrom.info.quality.toFixed();
                    } else {
                        qualityLabel = newDataFrom.info.quality;
                    }
                    if (newDataFrom.info.quality == 0) {
                        //qualityLabel = "BROKEN";
                    }
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .find(".item-slot-quality-bar")
                        .css({
                            "border-color": QualityColor,  /* Define a cor da borda para o progresso */
                            "clip-path": `inset(0 round ${qualityLabel}%)`  /* Ajusta a borda interna com base na qualidade */
                        })
                        .find("p")
                        .html(qualityLabel);
                    // }
                    // }
                }
            }
            $.post("https://rsg-inventory/PlayDropSound", JSON.stringify({}));
            $.post(
                "https://rsg-inventory/SetInventoryData",
                JSON.stringify({
                    fromInventory: $fromInv.attr("data-inventory"),
                    toInventory: $toInv.attr("data-inventory"),
                    fromSlot: $fromSlot,
                    toSlot: $toSlot,
                    fromAmount: $toAmount,
                })
            );
        } else {
            if (fromData.amount == $toAmount) {

                if (toData && toData.unique) {
                    InventoryError($fromInv, $fromSlot);
                    return;
                }
                if (
                    toData != undefined &&
                    toData.combinable != null &&
                    isItemAllowed(fromData.name, toData.combinable.accept)
                ) {
                    $.post(
                        "https://rsg-inventory/getCombineItem",
                        JSON.stringify({ item: toData.combinable.reward }),
                        function (item) {
                            $(".combine-option-text").html(
                                "<p>If you combine these items you get: <b>" +
                                item.label +
                                "</b></p>"
                            );
                        }
                    );
                    $(".combine-option-container").fadeIn(100);
                    combineslotData = [];
                    combineslotData.fromData = fromData;
                    combineslotData.toData = toData;
                    combineslotData.fromSlot = $fromSlot;
                    combineslotData.toSlot = $toSlot;
                    combineslotData.fromInv = $fromInv;
                    combineslotData.toInv = $toInv;
                    combineslotData.toAmount = $toAmount;
                    return;
                }

                fromData.slot = parseInt($toSlot);

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", fromData);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + fromData.label + "</p></div>";
                // if (fromData.name.split("_")[0] == "weapon") {
                // if (!Inventory.IsWeaponBlocked(fromData.name)) {
                ItemLabel =
                    '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                    fromData.label +
                    "</p></div>";
                // }
                // }

                if ($toSlot < 5 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                            fromData.image +
                            '" alt="' +
                            fromData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            formatAmount(fromData) +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((fromData.weight * fromData.amount) / 1000).toFixed(3) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else if ($toSlot == 43 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>5 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                            fromData.image +
                            '" alt="' +
                            fromData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            formatAmount(fromData) +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((fromData.weight * fromData.amount) / 1000).toFixed(3) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                            fromData.image +
                            '" alt="' +
                            fromData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            formatAmount(fromData) +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((fromData.weight * fromData.amount) / 1000).toFixed(3) +
                            "</p></div>" +
                            ItemLabel
                        );
                }

                // if (fromData.name.split("_")[0] == "weapon") {
                // if (!Inventory.IsWeaponBlocked(fromData.name)) {
                if (fromData.info.quality == undefined) {
                    fromData.info.quality = 100.0;
                }
                var QualityColor = "#79181d";
                if (fromData.info.quality < 25) {
                    QualityColor = "#79181d";
                } else if (
                    fromData.info.quality > 25 &&
                    fromData.info.quality < 50
                ) {
                    QualityColor = "#79181d";
                } else if (fromData.info.quality >= 50) {
                    QualityColor = "#79181d";
                }
                if (fromData.info.quality !== undefined) {
                    qualityLabel = fromData.info.quality.toFixed();
                } else {
                    qualityLabel = fromData.info.quality;
                }
                if (fromData.info.quality == 0) {
                    //qualityLabel = "BROKEN";
                }
                $toInv
                    .find("[data-slot=" + $toSlot + "]")
                    .find(".item-slot-quality-bar")
                    .css({
                        "border-color": QualityColor,  /* Define a cor da borda para o progresso */
                        "clip-path": `inset(0 round ${qualityLabel}%)`  /* Ajusta a borda interna com base na qualidade */
                    })
                    .find("p")
                    .html(qualityLabel);
                // }
                // }

                if (toData != undefined) {
                    toData.slot = parseInt($fromSlot);

                    $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .removeClass("item-nodrag");

                    $fromInv.find("[data-slot=" + $fromSlot + "]").data("item", toData);

                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + toData.label + "</p></div>";
                    // if (toData.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(toData.name)) {
                    ItemLabel =
                        '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                        toData.label +
                        "</p></div>";
                    // }
                    // }

                    if ($fromSlot < 5 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                toData.image +
                                '" alt="' +
                                toData.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(toData) +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((toData.weight * toData.amount) / 1000).toFixed(3) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else if (
                        $fromSlot == 43 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>5 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                toData.image +
                                '" alt="' +
                                toData.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(toData) +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((toData.weight * toData.amount) / 1000).toFixed(3) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                toData.image +
                                '" alt="' +
                                toData.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(toData) +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((toData.weight * toData.amount) / 1000).toFixed(3) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }

                    // if (toData.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(toData.name)) {
                    if (toData.info.quality == undefined) {
                        toData.info.quality = 100.0;
                    }
                    var QualityColor = "#79181d";
                    if (toData.info.quality < 25) {
                        QualityColor = "#79181d";
                    } else if (toData.info.quality > 25 && toData.info.quality < 50) {
                        QualityColor = "#79181d";
                    } else if (toData.info.quality >= 50) {
                        QualityColor = "#79181d";
                    }
                    if (toData.info.quality !== undefined) {
                        qualityLabel = toData.info.quality.toFixed();
                    } else {
                        qualityLabel = toData.info.quality;
                    }
                    if (toData.info.quality == 0) {
                        //qualityLabel = "BROKEN";
                    }
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .find(".item-slot-quality-bar")
                        .css({
                            "border-color": QualityColor,  /* Define a cor da borda para o progresso */
                            "clip-path": `inset(0 round ${qualityLabel}%)`  /* Ajusta a borda interna com base na qualidade */
                        })
                        .find("p")
                        .html(qualityLabel);
                    // }
                    // }

                    $.post(
                        "https://rsg-inventory/SetInventoryData",
                        JSON.stringify({
                            fromInventory: $fromInv.attr("data-inventory"),
                            toInventory: $toInv.attr("data-inventory"),
                            fromSlot: $fromSlot,
                            toSlot: $toSlot,
                            fromAmount: $toAmount,
                            toAmount: toData.amount,
                        })
                    );
                } else {
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .removeClass("item-drag");
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .addClass("item-nodrag");

                    $fromInv.find("[data-slot=" + $fromSlot + "]").removeData("item");

                    if ($fromSlot < 5 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                            );
                    } else if (
                        $fromSlot == 43 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>5 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                            );
                    }

                    $.post(
                        "https://rsg-inventory/SetInventoryData",
                        JSON.stringify({
                            fromInventory: $fromInv.attr("data-inventory"),
                            toInventory: $toInv.attr("data-inventory"),
                            fromSlot: $fromSlot,
                            toSlot: $toSlot,
                            fromAmount: $toAmount,
                        })
                    );
                }
                $.post("https://rsg-inventory/PlayDropSound", JSON.stringify({}));
            } else if (
                fromData.amount > $toAmount &&
                (toData == undefined || toData == null)
            ) {
                var newDataTo = [];
                newDataTo.name = fromData.name;
                newDataTo.label = fromData.label;
                newDataTo.amount = parseInt($toAmount);
                newDataTo.type = fromData.type;
                newDataTo.description = fromData.description;
                newDataTo.image = fromData.image;
                newDataTo.weight = fromData.weight;
                newDataTo.info = fromData.info;
                newDataTo.useable = fromData.useable;
                newDataTo.unique = fromData.unique;
                newDataTo.slot = parseInt($toSlot);

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", newDataTo);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + newDataTo.label + "</p></div>";
                // if (newDataTo.name.split("_")[0] == "weapon") {
                // if (!Inventory.IsWeaponBlocked(newDataTo.name)) {
                ItemLabel =
                    '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                    newDataTo.label +
                    "</p></div>";
                // }
                // }

                if ($toSlot < 5 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                            newDataTo.image +
                            '" alt="' +
                            newDataTo.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            formatAmount(newDataTo) +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newDataTo.weight * newDataTo.amount) / 1000).toFixed(3) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else if ($toSlot == 43 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>5 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                            newDataTo.image +
                            '" alt="' +
                            newDataTo.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            formatAmount(newDataTo) +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newDataTo.weight * newDataTo.amount) / 1000).toFixed(3) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                            newDataTo.image +
                            '" alt="' +
                            newDataTo.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            formatAmount(newDataTo) +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newDataTo.weight * newDataTo.amount) / 1000).toFixed(3) +
                            "</p></div>" +
                            ItemLabel
                        );
                }

                // if (newDataTo.name.split("_")[0] == "weapon") {
                // if (!Inventory.IsWeaponBlocked(newDataTo.name)) {
                if (newDataTo.info.quality == undefined) {
                    newDataTo.info.quality = 100.0;
                }
                var QualityColor = "#79181d";
                if (newDataTo.info.quality < 25) {
                    QualityColor = "#79181d";
                } else if (
                    newDataTo.info.quality > 25 &&
                    newDataTo.info.quality < 50
                ) {
                    QualityColor = "#79181d";
                } else if (newDataTo.info.quality >= 50) {
                    QualityColor = "#79181d";
                }
                if (newDataTo.info.quality !== undefined) {
                    qualityLabel = newDataTo.info.quality.toFixed();
                } else {
                    qualityLabel = newDataTo.info.quality;
                }
                if (newDataTo.info.quality == 0) {
                    //qualityLabel = "BROKEN";
                }
                $toInv
                    .find("[data-slot=" + $toSlot + "]")
                    .find(".item-slot-quality-bar")
                    .css({
                        "border-color": QualityColor,  /* Define a cor da borda para o progresso */
                        "clip-path": `inset(0 round ${qualityLabel}%)`  /* Ajusta a borda interna com base na qualidade */
                    })
                    .find("p")
                    .html(qualityLabel);
                // }
                // }

                var newDataFrom = [];
                newDataFrom.name = fromData.name;
                newDataFrom.label = fromData.label;
                newDataFrom.amount = parseInt(fromData.amount - $toAmount);
                newDataFrom.type = fromData.type;
                newDataFrom.description = fromData.description;
                newDataFrom.image = fromData.image;
                newDataFrom.weight = fromData.weight;
                newDataFrom.price = fromData.price;
                newDataFrom.info = fromData.info;
                newDataFrom.useable = fromData.useable;
                newDataFrom.unique = fromData.unique;
                newDataFrom.slot = parseInt($fromSlot);

                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .data("item", newDataFrom);

                $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .removeClass("item-nodrag");

                if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                            newDataFrom.image +
                            '" alt="' +
                            newDataFrom.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            formatAmount(newDataFrom) +
                            '</div><div class="item-slot-name"><p>' +
                            " $" +
                            newDataFrom.price +
                            '</p></div><div class="item-slot-label"><p>' +
                            newDataFrom.label +
                            "</p></div>"
                        );
                } else {
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' +
                        newDataFrom.label +
                        "</p></div>";
                    // if (newDataFrom.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                    ItemLabel =
                        '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                        newDataFrom.label +
                        "</p></div>";
                    // }
                    // }

                    if ($fromSlot < 5 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(newDataFrom) +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else if (
                        $fromSlot == 43 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>5 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(newDataFrom) +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(newDataFrom) +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }

                    // if (newDataFrom.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                    if (newDataFrom.info.quality == undefined) {
                        newDataFrom.info.quality = 100.0;
                    }
                    var QualityColor = "#79181d";
                    if (newDataFrom.info.quality < 25) {
                        QualityColor = "#79181d";
                    } else if (
                        newDataFrom.info.quality > 25 &&
                        newDataFrom.info.quality < 50
                    ) {
                        QualityColor = "#79181d";
                    } else if (newDataFrom.info.quality >= 50) {
                        QualityColor = "#79181d";
                    }
                    if (newDataFrom.info.quality !== undefined) {
                        qualityLabel = newDataFrom.info.quality.toFixed();
                    } else {
                        qualityLabel = newDataFrom.info.quality;
                    }
                    if (newDataFrom.info.quality == 0) {
                        //qualityLabel = "BROKEN";
                    }
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .find(".item-slot-quality-bar")
                        .css({
                            "border-color": QualityColor,  /* Define a cor da borda para o progresso */
                            "clip-path": `inset(0 round ${qualityLabel}%)`  /* Ajusta a borda interna com base na qualidade */
                        })
                        .find("p")
                        .html(qualityLabel);
                    // }
                    // }
                }
                $.post("https://rsg-inventory/PlayDropSound", JSON.stringify({}));
                $.post(
                    "https://rsg-inventory/SetInventoryData",
                    JSON.stringify({
                        fromInventory: $fromInv.attr("data-inventory"),
                        toInventory: $toInv.attr("data-inventory"),
                        fromSlot: $fromSlot,
                        toSlot: $toSlot,
                        fromAmount: $toAmount,
                    })
                );
            } else {
                InventoryError($fromInv, $fromSlot);
            }
        }
    } else {
        //InventoryError($fromInv, $fromSlot);
    }
    handleDragDrop();
    ajustFont();
}

function isItemAllowed(item, allowedItems) {
    var retval = false;
    $.each(allowedItems, function (index, i) {
        if (i == item) {
            retval = true;
        }
    });
    return retval;
}

function InventoryError($elinv, $elslot) {
    $elinv
        .find("[data-slot=" + $elslot + "]")
        .css("background", "rgba(156, 20, 20, 0.5)")
        .css("transition", "background 500ms");
    setTimeout(function () {
        $elinv
            .find("[data-slot=" + $elslot + "]")
            .css("background", "rgba(255, 255, 255, 0.3)");
    }, 500);
    $.post("https://rsg-inventory/PlayDropFail", JSON.stringify({}));
}

var requiredItemOpen = false;

(() => {
    Inventory = {};

    Inventory.slots = 40;

    Inventory.dropslots = 32;
    Inventory.droplabel = "Drop";
    Inventory.dropmaxweight = 100000;

    Inventory.Error = function () {
        $.post("https://rsg-inventory/PlayDropFail", JSON.stringify({}));
    };

    Inventory.IsWeaponBlocked = function (WeaponName) {
        var DurabilityBlockedWeapons = [
            "weapon_unarmed",
            "weapon_stickybomb",
        ];

        var retval = false;
        $.each(DurabilityBlockedWeapons, function (i, name) {
            if (name == WeaponName) {
                retval = true;
            }
        });
        return retval;
    };

    Inventory.QualityCheck = function (item, IsHotbar, IsOtherInventory) {
        // if (!Inventory.IsWeaponBlocked(item.name)) {
        // if (item.name.split("_")[0] == "weapon") {
        if (item.info.quality == undefined) {
            item.info.quality = 100;
        }
        var QualityColor = "#79181d";
        if (item.info.quality < 25) {
            QualityColor = "#79181d";
        } else if (item.info.quality > 25 && item.info.quality < 50) {
            QualityColor = "#79181d";
        } else if (item.info.quality >= 50) {
            QualityColor = "#79181d";
        }
        if (item.info.quality !== undefined) {
            qualityLabel = item.info.quality.toFixed();
        } else {
            qualityLabel = item.info.quality;
        }
        if (item.info.quality == 0) {
            //qualityLabel = "BROKEN";
            if (!IsOtherInventory) {
                if (!IsHotbar) {
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .find(".item-slot-quality-bar")
                        .css({
                            "border-color": QualityColor,  /* Define a cor da borda para o progresso */
                            "clip-path": `inset(0 round ${qualityLabel}%)`  /* Ajusta a borda interna com base na qualidade */
                        })
                        .find("p")
                        .html(qualityLabel);
                } else {
                    $(".z-hotbar-inventory")
                        .find("[data-zhotbarslot=" + item.slot + "]")
                        .find(".item-slot-quality-bar")
                        .css({
                            "border-color": QualityColor,  /* Define a cor da borda para o progresso */
                            "clip-path": `inset(0 round ${qualityLabel}%)`  /* Ajusta a borda interna com base na qualidade */
                        })
                        .find("p")
                        .html(qualityLabel);
                }
            } else {
                $(".other-inventory")
                    .find("[data-slot=" + item.slot + "]")
                    .find(".item-slot-quality-bar")
                    .css({
                        "border-color": QualityColor,  /* Define a cor da borda para o progresso */
                        "clip-path": `inset(0 round ${qualityLabel}%)`  /* Ajusta a borda interna com base na qualidade */
                    })
                    .find("p")
                    .html(qualityLabel);
            }
        } else {
            if (!IsOtherInventory) {
                if (!IsHotbar) {
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .find(".item-slot-quality-bar")
                        .css({
                            "border-color": QualityColor,  /* Define a cor da borda para o progresso */
                            "clip-path": `inset(0 round ${qualityLabel}%)`  /* Ajusta a borda interna com base na qualidade */
                        })
                        .find("p")
                        .html(qualityLabel);
                } else {
                    $(".z-hotbar-inventory")
                        .find("[data-zhotbarslot=" + item.slot + "]")
                        .find(".item-slot-quality-bar")
                        .css({
                            "border-color": QualityColor,  /* Define a cor da borda para o progresso */
                            "clip-path": `inset(0 round ${qualityLabel}%)`  /* Ajusta a borda interna com base na qualidade */
                        })
                        .find("p")
                        .html(qualityLabel);
                }
            } else {
                $(".other-inventory")
                    .find("[data-slot=" + item.slot + "]")
                    .find(".item-slot-quality-bar")
                    .css({
                        "border-color": QualityColor,  /* Define a cor da borda para o progresso */
                        "clip-path": `inset(0 round ${qualityLabel}%)`  /* Ajusta a borda interna com base na qualidade */
                    })
                    .find("p")
                    .html(qualityLabel);
            }
        }
        // }
        // }
    };

    Inventory.Open = function (data) {
        //console.log("OPEN INVENTORY");
        totalWeight = 0;
        totalWeightOther = 0;
        var v = data;

        // $('.namejs').html('<i class="fa fa-id-badge"> ID:</i> '+v.pid+' | NAME: '+v.pname+'')
        //$('.namejs').html(v.pname);
        $('.namejs').html('Alforge');
        $('.cashjs').html(v.pcash.toFixed(2));
        $('.goldjs').html(v.pgold.toFixed(2));
        $('.idjs').html('ID ' + v.pid);
        $(".player-inventory").find(".item-slot").remove();
        $(".ply-hotbar-inventory").find(".item-slot").remove();
        $(".ply-iteminfo-container").css("opacity", "0.0");

        if (requiredItemOpen) {
            $(".requiredItem-container").hide();
            requiredItemOpen = false;
        }

        $("#qbcore-inventory").fadeIn(300);
        if (data.other != null && data.other != "") {
            $(".other-inventory").attr("data-inventory", data.other.name);
            showDropInventory();
        } else {
            $(".other-inventory").attr("data-inventory", 0);
            hideDropInventory();
        }

        var firstSlots = $(".player-inventory-first");
        for (i = 1; i < 5; i++) {
            firstSlots.append(
                '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-key"><p>' +
                i +
                '</p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
            );
        }
        $(".player-inventory").append(firstSlots);

        var remainingSlots = $(".player-inventory");
        var count = 1; // Contador para os slots
        for (i = 5; i < data.slots + 1; i++) {
            if (count > 4) {  // Quebra de linha a cada 4 slots
                remainingSlots.append('<div class="clear"></div>');  // Isso pode depender da estrutura do seu CSS
                count = 1;
            }
        
            if (i == 43) {
                remainingSlots.append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-key"><p>5 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            } else {
                remainingSlots.append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        
            count++; // Incrementa o contador de slots por fileira
        }
        $(".player-inventory").append(remainingSlots);

        if (data.other != null && data.other != "") {
            for (i = 1; i < data.other.slots + 1; i++) {
                $(".other-inventory").append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        } else {
            for (i = 1; i < Inventory.dropslots + 1; i++) {
                $(".other-inventory").append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
            $(".other-inventory .item-slot").css({
                "background-color": "rgba(0, 0, 0, 0.3)",
            });
        }

        if (data.inventory !== null) {
            $.each(data.inventory, function (i, item) {
                if (item != null) {
                    totalWeight += item.weight * item.amount;
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + item.label + "</p></div>";
                    // if (item.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(item.name)) {
                    ItemLabel =
                        '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                        item.label +
                        "</p></div>";
                    // }
                    // }
                    if (item.slot < 5) {
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .addClass("item-drag");
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                item.slot +
                                '</p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(item) +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(3) +
                                "</p></div>" +
                                ItemLabel
                            );
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .data("item", item);
                    } else if (item.slot == 43) {
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .addClass("item-drag");
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-key"><p>5 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(item) +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(3) +
                                "</p></div>" +
                                ItemLabel
                            );
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .data("item", item);
                    } else {
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .addClass("item-drag");
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(item) +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(3) +
                                "</p></div>" +
                                ItemLabel
                            );
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .data("item", item);
                    }
                    Inventory.QualityCheck(item, false, false);
                }
            });
        }

        if (
            data.other != null &&
            data.other != "" &&
            data.other.inventory != null
        ) {
            $.each(data.other.inventory, function (i, item) {
                if (item != null) {
                    totalWeightOther += item.weight * item.amount;
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + item.label + "</p></div>";
                    // if (item.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(item.name)) {
                    ItemLabel =
                        '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                        item.label +
                        "</p></div>";
                    // }
                    // }
                    $(".other-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag");
                    if (item.price != null) {
                        $(".other-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(item) +
                                '</div><div class="item-slot-name"><p>' +
                                " $" +
                                item.price +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $(".other-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(item) +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(3) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }
                    $(".other-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .data("item", item);
                    Inventory.QualityCheck(item, false, true);
                }
            });
        }

        var per = (totalWeight / 1000) / (data.maxweight / 100000)
        $(".pro").css("width", per + "%");
        $("#player-inv-weight").html(
            // '<i class="fas fa-dumbbell"></i> ' +
            (totalWeight / 1000).toFixed(2) +
            "/" +
            (data.maxweight / 1000).toFixed(2)
        );
        playerMaxWeight = data.maxweight;
        if (data.other != null) {
            var name = data.other.name.toString();
            if (
                name != null &&
                (name.split("-")[0] == "itemshop" || name == "crafting")
            ) {
                $("#other-inv-label").html(data.other.label);
            } else {
                $("#other-inv-label").html(data.other.label);
                $("#other-inv-weight").html(
                    // '<i class="fas fa-dumbbell"></i> ' +
                    (totalWeightOther / 1000).toFixed(3) +
                    "/" +
                    (data.other.maxweight / 1000).toFixed(3)
                );
            }
            otherMaxWeight = data.other.maxweight;
            otherLabel = data.other.label;
            var per1 = (totalWeightOther / 1000) / (otherMaxWeight / 100000)
            $(".pro1").css("width", per1 + "%");
        } else {
            $("#other-inv-label").html(Inventory.droplabel);
            $("#other-inv-weight").html(
                // '<i class="fas fa-dumbbell"></i> ' +
                (totalWeightOther / 1000).toFixed(3) +
                "/" +
                (Inventory.dropmaxweight / 1000).toFixed(3)
            );
            otherMaxWeight = Inventory.dropmaxweight;
            otherLabel = Inventory.droplabel;
            var per1 = (totalWeightOther / 1000) / (otherMaxWeight / 100000)
            $(".pro1").css("width", per1 + "%");
        }

        $.each(data.maxammo, function (index, ammotype) {
            $("#" + index + "_ammo")
                .find(".ammo-box-amount")
                .css({ height: "0%" });
        });

        if (data.Ammo !== null) {
            $.each(data.Ammo, function (i, amount) {
                var Handler = i.split("_");
                var Type = Handler[1].toLowerCase();
                if (amount > data.maxammo[Type]) {
                    amount = data.maxammo[Type];
                }
                var Percentage = (amount / data.maxammo[Type]) * 100;

                $("#" + Type + "_ammo")
                    .find(".ammo-box-amount")
                    .css({ height: Percentage + "%" });
                $("#" + Type + "_ammo")
                    .find("span")
                    .html(amount);
            });
        }
        handleDragDrop();
        ajustFont();
    };

    Inventory.Close = function () {
        // $(".item-slot").css("border", "1px solid rgba(255, 255, 255, 0.1)");
        $(".ply-hotbar-inventory").css("display", "block");
        // $(".ply-iteminfo-container").css("display", "none");
        $(".ply-iteminfo-container").css("opacity", "0.0");
        $("#qbcore-inventory").fadeOut(300);
        $(".combine-option-container").hide();
        $(".item-slot").remove();
        if ($("#rob-money").length) {
            $("#rob-money").remove();
        }
        $.post("https://rsg-inventory/CloseInventory", JSON.stringify({}));
        $("#contextMenu").hide();


        if (AttachmentScreenActive) {
            $("#qbcore-inventory").css({ left: "0vw" });
            $(".weapon-attachments-container").css({ left: "-100vw" });
            AttachmentScreenActive = false;
        }

        if (ClickedItemData !== null) {
            $("#weapon-attachments").fadeOut(250, function () {
                $("#weapon-attachments").remove();
                ClickedItemData = {};
            });
        }

        ajustFont();
    };

    Inventory.Update = function (data) {
        totalWeight = 0;
        totalWeightOther = 0;
        $(".player-inventory").find(".item-slot").remove();
        $(".player-inventory-first").find(".item-slot").remove();
        $(".ply-hotbar-inventory").find(".item-slot").remove();
        if (data.error) {
            Inventory.Error();
        }

        var firstSlots = $(".player-inventory-first");
        for (i = 1; i < 5; i++) {
            firstSlots.append(
                '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-key"><p>' +
                i +
                '</p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
            );
        }
        $(".player-inventory").append(firstSlots);

        var remainingSlots = $(".player-inventory");
        for (i = 5; i < data.slots + 1; i++) {
            if (i == 43) {
                remainingSlots.append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-key"><p>5 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            } else {
                remainingSlots.append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        }
        $(".player-inventory").append(remainingSlots);

        if (data.inventory !== null) {
            $.each(data.inventory, function (i, item) {
                if (item != null) {
                    totalWeight += item.weight * item.amount;
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + item.label + "</p></div>";
                    ItemLabel =
                        '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                        item.label +
                        "</p></div>";
                    if (item.slot < 5) {
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .addClass("item-drag");
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                item.slot +
                                '</p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(item) +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(3) +
                                "</p></div>" +
                                ItemLabel
                            );
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .data("item", item);
                    } else if (item.slot == 43) {
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .addClass("item-drag");
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-key"><p>5 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(item) +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(3) +
                                "</p></div>" +
                                ItemLabel
                            );
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .data("item", item);
                    } else {
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .addClass("item-drag");
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(item) +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(3) +
                                "</p></div>" +
                                ItemLabel
                            );
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .data("item", item);
                    }
                    Inventory.QualityCheck(item, false, false);
                }
            });
        }

        if (
            data.other != null &&
            data.other != "" &&
            data.other.inventory != null
        ) {
            $.each(data.other.inventory, function (i, item) {
                if (item != null) {
                    totalWeightOther += item.weight * item.amount;
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + item.label + "</p></div>";
                    ItemLabel =
                        '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                        item.label +
                        "</p></div>";
                    $(".other-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag");
                    if (item.price != null) {
                        $(".other-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(item) +
                                '</div><div class="item-slot-name"><p>' +
                                " $" +
                                item.price +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $(".other-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                formatAmount(item) +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(3) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }
                    $(".other-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .data("item", item);
                    Inventory.QualityCheck(item, false, true);
                }
            });
        }

        handleDragDrop();
        ajustFont();
    };

    Inventory.ToggleHotbar = function (data) {
        if (data.open) {
            $(".z-hotbar-inventory").html("");
            for (i = 1; i < 5; i++) {
                var elem =
                    '<div class="z-hotbar-item-slot" data-zhotbarslot="' +
                    i +
                    '"> <div class="z-hotbar-item-slot-key"><p>' +
                    i +
                    '</p></div><div class="z-hotbar-item-slot-img"></div><div class="z-hotbar-item-slot-label"><p>&nbsp;</p></div></div>';
                $(".z-hotbar-inventory").append(elem);
            }
            // var elem =
            //     '<div class="z-hotbar-item-slot" data-zhotbarslot="43"> <div class="z-hotbar-item-slot-key"><p>6 <i style="top: -62px; left: 58px;" class="fas fa-lock"></i></p></div><div class="z-hotbar-item-slot-img"></div><div class="z-hotbar-item-slot-label"><p>&nbsp;</p></div></div>';
            // $(".z-hotbar-inventory").append(elem);
            $.each(data.items, function (i, item) {
                if (item != null) {
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + item.label + "</p></div>";
                    // if (item.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(item.name)) {
                    ItemLabel =
                        '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                        item.label +
                        "</p></div>";
                    // }
                    // }
                    if (item.slot == 43) {
                        $(".z-hotbar-inventory")
                            .find("[data-zhotbarslot=" + item.slot + "]")
                            .html(
                                '<div class="z-hotbar-item-slot-key"><p>5 <i style="top: -62px; left: 58px;" class="fas fa-lock"></i></p></div><div class="z-hotbar-item-slot-img"><img src="http://127.0.0.1/items/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="z-hotbar-item-slot-amount"><p>' +
                                formatAmount(item) +
                                '</div><div class="z-hotbar-item-slot-amount-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(3) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $(".z-hotbar-inventory")
                            .find("[data-zhotbarslot=" + item.slot + "]")
                            .html(
                                '<div class="z-hotbar-item-slot-key"><p>' +
                                item.slot +
                                '</p></div><div class="z-hotbar-item-slot-img"><img src="http://127.0.0.1/items/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="z-hotbar-item-slot-amount"><p>' +
                                formatAmount(item) +
                                '</div><div class="z-hotbar-item-slot-amount-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(3) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }
                    Inventory.QualityCheck(item, true, false);
                }
            });
            $(".z-hotbar-inventory").fadeIn(150);
        } else {
            $(".z-hotbar-inventory").fadeOut(150, function () {
                $(".z-hotbar-inventory").html("");
            });
        }
        ajustFont();
    };

    Inventory.UseItem = function (data) {
        $(".itembox-container").hide();
        $(".itembox-container").fadeIn(250);
        $("#itembox-action").html("<p>Used</p>");
        $("#itembox-label").html("<p>" + data.item.label + "</p>");
        $("#itembox-image").html(
            '<div class="item-slot-img"><img src="http://127.0.0.1/items/' +
            data.item.image +
            '" alt="' +
            data.item.name +
            '" /></div>'
        );
        setTimeout(function () {
            $(".itembox-container").fadeOut(250);
        }, 2000);
        ajustFont();
    };

    var itemBoxtimer = null;
    var requiredTimeout = null;

    Inventory.itemBox = function (data) {
        if (itemBoxtimer !== null) {
            clearTimeout(itemBoxtimer);
        }
        var type = "Used";
        if (data.type == "add") {
            type = "Received";
        } else if (data.type == "remove") {
            type = "Removed";
        }

        var $itembox = $(".itembox-container.template").clone();
        $itembox.removeClass("template");
        $itembox.html(
            '<div id="itembox-action"><p>' +
            type +
            '</p></div><div id="itembox-label"><p>' +
            data.item.label + ' x' + data.amount +
            '</p></div><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
            data.item.image +
            '" alt="' +
            data.item.name +
            '" /></div>'
        );
        $(".itemboxes-container").prepend($itembox);
        $itembox.fadeIn(250);
        setTimeout(function () {
            $.when($itembox.fadeOut(300)).done(function () {
                $itembox.remove();
            });
        }, 3000);
        ajustFont();
    };

    Inventory.RequiredItem = function (data) {
        if (requiredTimeout !== null) {
            clearTimeout(requiredTimeout);
        }
        if (data.toggle) {
            if (!requiredItemOpen) {
                $(".requiredItem-container").html("");
                $.each(data.items, function (index, item) {
                    var element =
                        '<div class="requiredItem-box"><div id="requiredItem-action">Required</div><div id="requiredItem-label"><p>' +
                        item.label +
                        '</p></div><div id="requiredItem-image"><div class="item-slot-img"><img src="http://127.0.0.1/items/' +
                        item.image +
                        '" alt="' +
                        item.name +
                        '" /></div></div></div>';
                    $(".requiredItem-container").hide();
                    $(".requiredItem-container").append(element);
                    $(".requiredItem-container").fadeIn(100);
                });
                requiredItemOpen = true;
            }
        } else {
            $(".requiredItem-container").fadeOut(100);
            requiredTimeout = setTimeout(function () {
                $(".requiredItem-container").html("");
                requiredItemOpen = false;
            }, 100);
        }
    };

    window.onload = function (e) {
        window.addEventListener("message", function (event) {
            switch (event.data.action) {
                case "open":
                    Inventory.Open(event.data);
                    break;
                case "close":
                    Inventory.Close();
                    break;
                case "update":
                    Inventory.Update(event.data);
                    break;
                case "itemBox":
                    Inventory.itemBox(event.data);
                    break;
                case "requiredItem":
                    Inventory.RequiredItem(event.data);
                    break;
                case "toggleHotbar":
                    Inventory.ToggleHotbar(event.data);
                    break;
                case "RobMoney":
                    $(".inv-options-list").append(
                        '<div class="inv-option-item" id="rob-money"><p><i style="margin-top: 1rem" class="fas fa-hand-holding-dollar"></i></p></div>'
                    );
                    $("#rob-money").data("TargetId", event.data.TargetId);
                    break;
            }
        });
    };
})();

$(document).on("click", "#rob-money", function (e) {
    e.preventDefault();
    var TargetId = $(this).data("TargetId");
    $.post(
        "https://rsg-inventory/RobMoney",
        JSON.stringify({
            TargetId: TargetId,
        })
    );
    $("#rob-money").remove();
});


$(document).ready(function () {
    $(document).on('contextmenu', '.item-slot', function (e) {
        e.preventDefault();
        var top = e.pageY;
        var left = e.pageX;
        var ItemData = $(this).data("item");
        //console.log(JSON.stringify(ItemData));
        var ItemInventory = $(this).parent().attr("data-inventory");
        var $clickedSlot = $(this);
        $("#contextMenu").css({ display: "block", top: top, left: left });
        $("#contextMenu").data('clickedSlot', $clickedSlot);

        // Limpar opções personalizadas anteriores
        $("#contextMenu .custom-option").remove();

        // Adicionar ações padrão
        $('#use-item').off('click').on('click', function () {
            Inventory.Close();
            $.post(
                "https://rsg-inventory/UseItem",
                JSON.stringify({
                    inventory: ItemInventory,
                    item: ItemData,
                })
            );
        });

        $('#give-item').off('click').on('click', function () {
            var dragAmount = $("#item-amount").val();

            if ($clickedSlot.data("item").name === "cash") {
                dragAmount = dragAmount * 100;
            }

            $("#contextMenu").hide();
            $.post(
                "https://rsg-inventory/GiveItem",
                JSON.stringify({
                    inventory: ItemInventory,
                    item: ItemData,
                    amount: dragAmount
                })
            );
        });

        $('#drop-item').off('click').on('click', function () {
            var $clickedSlot = $("#contextMenu").data('clickedSlot');
            var fromSlot = $clickedSlot.attr("data-slot");
            var fromInventory = $clickedSlot.parent();
            var toInventory, toSlot;
            if ($(fromInventory).attr("data-inventory") == "player") {
                toInventory = $(".other-inventory");
            } else {
                toInventory = $(".player-inventory");
            }
            toSlot = GetFirstFreeSlot(toInventory, $clickedSlot);
            if ($clickedSlot.data("item") === undefined) {
                $("#contextMenu").hide();
                return;
            }

            // var toAmount = $clickedSlot.data("item").amount;
            // if (toAmount > 1) {
            //     toAmount = 1;
            // }
            
            var dragAmount = $("#item-amount").val();
            var toAmount = dragAmount;

            if ($clickedSlot.data("item").name === "cash") {
                toAmount = dragAmount * 100;
            }

            if ($clickedSlot.data("item").name !== "cash") {
                // console.log(Math.floor(toAmount))
                // console.log(toAmount);

                if (Math.floor(toAmount) != toAmount) {
                    // console.log("ELE É FLOAT");
                    InventoryError(fromInventory, fromSlot);
                    return false;
                }
            }
            
            if (CanQuickMove()) {
                if (toSlot === null) {
                    InventoryError(fromInventory, fromSlot);
                } else if (!(fromSlot === toSlot && fromInventory.is(toInventory))) {
                    if (updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)) {
                        swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                    }
                }
            } else {
                InventoryError(fromInventory, fromSlot);
            }
            $("#contextMenu").hide();
        });

        if (ItemData) {
            if (ItemData.context !== undefined) {
                const customOption = $('<div class="context-menu-item custom-option" data-trigger="' + ItemData.trigger + '">' + ItemData.context + '</div>');
                $('.context-menu-items').append(customOption);
                customOption.on('click', function () {
                    const triggerName = $(this).data('trigger');
                    $.post(`https://rsg-inventory/${triggerName}`, JSON.stringify({}));
                });
            }
        }

        return false;
    });

    $(document).on('click', function (e) {
        $("#contextMenu").hide();
    });
});

$(document).ready(function () {

    function onDraggable() {
        if (!$("#qbcore-inventory").hasClass("ui-draggable")) {
            $("#qbcore-inventory").draggable({
                handle: ".inv-dragger",
                appendTo: "body"
            });
        }
    }

    function offDraggable() {
        if ($("#qbcore-inventory").hasClass("ui-draggable")) {
            $("#qbcore-inventory").draggable('destroy');
        }
    }

    function checkAndApply() {
        if ($('#toggle-switch').is(':checked')) {
            offDraggable();
        } else {
            onDraggable();
        }
    }

    checkAndApply();

    $('#toggle-switch').change(checkAndApply);
});

function formatDecimalInput(element) {
    let cursorPosition = element.selectionStart;
    let value = element.value;
    value = value.replace(/[^0-9.]/g, '');
    let parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts.length > 1) {
        parts[1] = parts[1].substring(0, 2);
        value = parts[0] + '.' + parts[1];
    }
    element.value = value;
    element.setSelectionRange(cursorPosition, cursorPosition);
}

$(document).ready(function () {

    $('#settings-btn').on("click", function () {
        $('.player-settings').css("display", "flex");
    });

    $('.player-settings-close').on("click", function () {
        $('.player-settings').css("display", "none");
    });

    $(document).on('keydown', function (e) {
        if (e.keyCode === 27) {
            if ($('.player-settings').css('display') === 'flex') {
                $('.player-settings').css('display', 'none');
            }
        }
    });

    $('#rangeInput').on('input', function () {
        var value = $(this).val();
        var opacity = value / 100;
        $('#inv-img-bg').css('opacity', opacity);
    });

})

function ajustFont() {
    $('.item-slot-amount').each(function () {
        const textLength = $(this).find('p').text().trim().length;
        if (textLength > 5) {
            $(this).find('p').css('font-size', '0.90vh');
            $(this).find('p').css('top', '30%');
        } else if (textLength > 4) {
            $(this).find('p').css('font-size', '1.10vh');
            $(this).find('p').css('top', '28%');
        } else if (textLength > 3) {
            $(this).find('p').css('font-size', '1.30vh');
            $(this).find('p').css('top', '26%');
        } else {
            $(this).find('p').css('font-size', '1.45vh');
            $(this).find('p').css('top', '23%');
        }
    });
}


